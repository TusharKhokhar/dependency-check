const axios = require('axios')
const { MONERIS_ENV, MONERIS_URL, DEFAULT_CUSTOMER_LOGO, DEFAULT_PRODUCT_NAME } = require('../../helpers/constants')

const generateMonerisTicket = async (inputData, encryptedData, user) => {
  const { StoreId, ApiToken, CheckoutId } = encryptedData.Moneris
  const { ProductName, Price, Image } = inputData
  
  const monerisUrl = MONERIS_URL
  const requestData = {
    store_id: StoreId,
    api_token: ApiToken,
    checkout_id: CheckoutId,
    cust_id: `${user._id}`,
    txn_total: `${parseFloat(1 * Price).toFixed(2)}`,
    environment: MONERIS_ENV,
    action: 'preload',
    cart: {
      items: [
        {
          url: Image && Image.length ? Image : DEFAULT_CUSTOMER_LOGO,
          description: ProductName && ProductName.length ? ProductName : DEFAULT_PRODUCT_NAME,
          unit_cost: `${parseFloat(Price).toFixed(2)}`,
          quantity: 1,
        },
      ],
    },
  }
  
  try {
    const { data } = await axios.post(monerisUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const success = data?.response?.success
    if(success === 'true') {
      return data.response
    } else {
      throw new Error(data.response.error.message)
    }
  } catch (e) {
    console.log(e)
    throw new Error(e)
  }
}

module.exports = generateMonerisTicket