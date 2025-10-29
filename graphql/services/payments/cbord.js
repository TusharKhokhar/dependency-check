const xml2js = require("xml2js");
const axios = require("axios");
const CustomLogger = require("../../helpers/customLogger");
const { createPaymentStatus } = require("../../models/payment");
const log = new CustomLogger();

// extract numeric balance from a string like 'USD1000'
const extractUSDBalance = (balanceString) => {
  if (!balanceString) return null;
  const match = balanceString.match(/^[A-Z]+(\d+)$/);

  if (match && match[1]) {
    const cents = parseInt(match[1], 10);
    return (cents / 100).toFixed(2);
  }
    
  return "0.00";
};

// extract currency code from a string like 'USD1000'
const extractCurrencyCode = (balanceString) => {
  const match = balanceString.match(/^[A-Z]+/);
  return match ? match[0] : null;
};

// parse XML response and extract relevant data
const parseXmlResponse = async (responseData) => {
  const parser = new xml2js.Parser({ explicitArray: false });
  const parsedData = await parser.parseStringPromise(responseData);
  return parsedData?.Message?.CSGoldMessages || {};
};

// Convert usd to usdc
const convertUsdToUsdcId = (currency, amount) => {
  const units = Math.round(amount * 100);
  return "USDC" + units.toString().padStart(12, '0');
}

const getCbordBalance = async (paymentOption, cardNumber) => {
  try {
    const {
      URL: endpointUrl,
      Class,
      CodeAccountType: Code,
      Provider,
      MediaEntry,
      Location,
      SysTraceAuditNumber = 64,
    } = paymentOption;

    const xmlPayload = `<Message>
      <CSGoldMessages>
        <Class>${Class}</Class>
        <Code>${Code}</Code>
        <Provider>${Provider}</Provider>
        <MediaValue>${cardNumber}</MediaValue>
        <MediaEntry>${MediaEntry}</MediaEntry>
        <Location>${Location}</Location>
        <SysTraceAuditNumber>${SysTraceAuditNumber}</SysTraceAuditNumber>
      </CSGoldMessages>
    </Message>`;

    log.info("xmlPayload **********", xmlPayload);
    const response = await axios.post(endpointUrl, xmlPayload, {
      headers: {
        "X-Auth-CBORD-Vendor-Name": Provider,
        "X-Auth-CBORD-Vendor-Timestamp": Math.floor(
          Date.now() / 1000
        ).toString(),
        "Content-Type": "application/xml",
        Accept: "application/xml",
      },
    });
    const csGoldMessage = await parseXmlResponse(response.data);

    return {
      message: csGoldMessage?.HostMessage,
      txid: csGoldMessage?.TransID || null,
      amount: {
        remaining: extractUSDBalance(csGoldMessage?.EndSVCbalance),
        currency: extractCurrencyCode(csGoldMessage?.EndSVCbalance),
      },
    };
  } catch (error) {
    log.error("cbordGetBalance error:", error);
    throw new Error(error || "Failed to retrieve balance.");
  }
};

const transactionRequest = async (
  paymentOption,
  cardNumber,
  currency,
  tranAmount
) => {
  try {
    const {
      URL: endpointURL,
      Class,
      Provider,
      MediaEntry,
      Location,
      SysTraceAuditNumber = 64,
    } = paymentOption;
    const finalAmount = convertUsdToUsdcId(currency, tranAmount);
    return await axios.post(
      `${endpointURL}`,
      `<Message>
                <CSGoldMessages>
                    <Class>${Class}</Class>
                    <Code>009999</Code>
                    <Provider>${Provider}</Provider>
                    <MediaValue>${cardNumber}</MediaValue>
                    <MediaEntry>${MediaEntry}</MediaEntry>
                    <Location>${Location}</Location>
                    <TranAmount>${finalAmount}</TranAmount>
                    <SysTraceAuditNumber>${SysTraceAuditNumber}</SysTraceAuditNumber>
                </CSGoldMessages>
          </Message>`,
      {
        headers: {
          "X-Auth-CBORD-Vendor-Name": Provider,
          "X-Auth-CBORD-Vendor-Timestamp": Math.floor(
            Date.now() / 1000
          ).toString(),
          "Content-Type": "application/xml",
        },
      }
    );
  } catch (error) {
    log.error("send transaction request error *****", error);
    throw error;
  }
};

const sendCboardTransaction = async (
  paymentOption,
  cardNumber,
  tranAmount,
  currency,
  customerId,
  paymentType,
  device,
  thingID,
  db
) => {
  try {
    const response = await transactionRequest(
      paymentOption,
      cardNumber,
      currency,
      tranAmount
    );
    const transactionMessage = await parseXmlResponse(response.data);

    if (transactionMessage?.HostMessage?.toLowerCase().includes("approved")) {
      return await cbordAckChargeAccount(
        paymentOption,
        tranAmount,
        customerId,
        paymentType,
        device,
        thingID,
        db,
        transactionMessage?.TransID
      );
    }
    return {
      message: transactionMessage?.HostMessage,
      approved: 0,
      statusCode: 400,
    };
  } catch (error) {
    log.error("cbordChargeAccount *****", error);
    throw error;
  }
};

const cbordAckChargeAccount = async (
  paymentOption,
  tranAmount,
  customerId,
  paymentType,
  device,
  thingID,
  db,
  transID
) => {
  try {
    const {
      URL: endpointURL,
      Class,
      Provider,
    } = paymentOption;
    const xmlPayload = `<Message>
        <CSGoldMessages>
          <Class>${Class}</Class>
          <Code>909999</Code>
          <Provider>${Provider}</Provider>
          <TransID>${transID}</TransID>
        </CSGoldMessages>
    </Message>`;

    log.info("xmlPayload in cbordAckChargeAccount **********", xmlPayload);
    const response = await axios.post(endpointURL, xmlPayload, {
      headers: {
        "X-Auth-CBORD-Vendor-Name": Provider,
        "X-Auth-CBORD-Vendor-Timestamp": Math.floor(
          Date.now() / 1000
        ).toString(),
        "Content-Type": "application/xml",
        Accept: "application/xml",
      },
    });

    const csGoldMessage = await parseXmlResponse(response.data);
    log.info("csGold transaction response", csGoldMessage);

    if (csGoldMessage?.HostMessage?.toLowerCase().includes("success")) {
      const paymentStatusData = {
        customerId: customerId,
        txId: transID,
        amount: tranAmount?.total || tranAmount,
        status: csGoldMessage?.HostMessage?.toLowerCase().includes("success")
          ? "succeeded"
          : "failed",
        paymentType: paymentType,
        terminalId: null,
        device: device,
        thingId: thingID,
      };
      await createPaymentStatus(db, paymentStatusData);
    } else {
      log.info("send transaction failed *********");
      return {
        message: `Transaction ${csGoldMessage?.HostMessage}`,
        statusCode: 400,
      };
    }

    return {
      message: csGoldMessage?.HostMessage?.toLowerCase().includes("success")
        ? "Transaction Approved"
        : `Transaction ${csGoldMessage?.HostMessage}`,
      statusCode: 200,
    };
  } catch (error) {
    log.error("cbordAckChargeAccount *****", error);
    throw error;
  }
};

module.exports = {
  getCbordBalance,
  sendCboardTransaction,
  cbordAckChargeAccount,
};
