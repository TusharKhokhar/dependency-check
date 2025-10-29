const {SecretsManagerClient, GetSecretValueCommand} = require("@aws-sdk/client-secrets-manager");
const config = require("../../config/config");
const { ATRIUM_ENDPOINT, ATRIUM_GET_TOKEN } = require('../../helpers/constants');
const axios = require("axios");
const CustomLogger = require("../../helpers/customLogger");
const { createPaymentStatus } = require("../../models/payment");
const log = new CustomLogger()


const atriumAuthToken = async (region) => {
    try {
        const secretName = `${config.Stage}/${config.domainName}/atrium`;
        const client = new SecretsManagerClient({ region });
        const params = { SecretId: secretName };
        const command = new GetSecretValueCommand(params);
        const response = await client.send(command);
        if ("SecretString" in response) {
            return JSON.parse(response.SecretString);
        }
        throw new Error("SecretString not found in response");
    } catch (e) {
        log.error(e);
        throw e;
    }
};

const atriumGetToken = async (authData, atriumEndpoint) => {
    try {
        const reqData = {
            "oauth": {
                "client_id": authData.clientId,
                "client_secret_key": authData.secretKey
            }
        }
        const { data } = await axios.post(`${ATRIUM_GET_TOKEN}`, reqData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('data*****',data);
        return data?.access_token
    } catch (error) {
        log.error(error);
        throw new Error(error)
    }
}

const atriumGetBalance = async (token, terminalId, accountMode, accountNumber, cardNumber, atriumEndpoint) => {
    try {
        const requestBody = {
            "version": 1,
            "key": token,
            "type": "inquiry",
            "customer": {
                "type": "card",
                "number": cardNumber
            },
            "account": {
                "mode": accountMode,
                "number": accountNumber
            },
            "origin": {
                "type": "terminal",
                "id": terminalId
            },
            "time": {
                "state": "offline",
                "timezone": "local"
            }
        }
        const response = await axios.post(`${atriumEndpoint}${ATRIUM_ENDPOINT}`, requestBody, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data
    } catch (error) {
        log.error(error);
        throw new Error(error)
    }
};

const getAtriumBalance = async (paymentOption, cardNumber) => {
  try {
    const {
      TerminalID: terminalId,
      AccountMode: accountMode,
      AccountNumber: accountNumber,
      AtriumEndpoint: endpoint,
    } = paymentOption;
    const authData = await atriumAuthToken(config.region);
    const token = await atriumGetToken(authData, endpoint);
    const balance = await atriumGetBalance(
      token,
      terminalId,
      accountMode,
      accountNumber,
      cardNumber,
      endpoint
    );
    log.info("atrium balance ******", balance);
    return balance;
  } catch (error) {
    log.error("Error while getting atrium balance", error);
    throw error;
  }
};

const atriumSendTransaction = async (token, cardNumber, accountNumber, terminalId,
                                     currency, amount, accountMode, atriumEndpoint) => {
    try {
        const reqData = {
            "version": 1,
            "key": token,
            "type": "charge",
            "customer": {
                "type": "rawcard",
                "number": cardNumber
            },
            "account": {
                "mode": accountMode,
                "number": accountNumber
            },
            "origin": {
                "type": "terminal",
                "id": terminalId
            },
            "amount": {
                "currency": currency ? currency : "USD",
                "total": amount
            },
            "time": {
                "state": "offline",
                "timezone": "local"
            }
        }
        console.log('atriumEndpoint****',atriumEndpoint);
        console.log(`${atriumEndpoint}${ATRIUM_ENDPOINT}`);
        const response = await axios.post(`${atriumEndpoint}${ATRIUM_ENDPOINT}`, reqData);
        return response.data
    } catch (error) {
        log.error(error);
        throw new Error(error)
    }
};

const sendAtriumTransaction = async (
  paymentOption,
  currency,
  amount,
  cardNumber,
  customerId,
  paymentType,
  device,
  thingID,
  db
) => {
  try {
    const {
      TerminalID: terminalId,
      AccountMode: accountMode,
      AccountNumber: accountNumber,
      AtriumEndpoint: endpoint,
    } = paymentOption;
    const authData = await atriumAuthToken(config.region);
    const token = await atriumGetToken(authData, endpoint);

    const transactionResponse = await atriumSendTransaction(
      token,
      cardNumber,
      accountNumber,
      terminalId,
      currency,
      amount,
      accountMode,
      endpoint
    );
    log.info("atrium transaction response", transactionResponse);
    if (transactionResponse?.message?.toLowerCase().includes("approved")) {
      const paymentStatusData = {
        customerId: customerId,
        txId: transactionResponse?.txid || transactionResponse?.TransID,
        amount: amount?.total || amount,
        status: transactionResponse.approved === 1 ? "succeeded" : "failed",
        paymentType: paymentType,
        terminalId,
        device: device,
        thingId: thingID,
      };
      await createPaymentStatus(db, paymentStatusData);
    } else {
      log.info("send transaction failed *********");
      return {
        message: `Transaction ${transactionResponse?.message}`,
        statusCode: 400,
      };
    }
    return {
      message: transactionResponse?.message?.toLowerCase().includes("approved")
        ? "Transaction Approved"
        : `Transaction ${transactionResponse?.message}`,
      statusCode: 200,
    };
  } catch (error) {
    log.error("Error while sending atrium transaction", error);
    throw error;
  }
};

module.exports = {
    atriumAuthToken,
    atriumGetToken,
    atriumGetBalance,
    atriumSendTransaction,
    getAtriumBalance,
    sendAtriumTransaction
}