const Stripe = require('stripe')
const { getUtcTime, addWebhookUrl} = require('../../helpers/util');
const { DEFAULT_CUSTOMER_LOGO, DEFAULT_PRODUCT_NAME } = require('../../helpers/constants')

const generateStripeUrlFunction = async(encryptedData, stripeInputData, user) => {
    const { ProductName, Image, Currency, Price, SuccessUrl, CancelUrl } = stripeInputData
    const { _id, PrimaryEmail, Username } = user
    const { SecretKey } = encryptedData.Stripe

    try {
        const stripe = new Stripe(SecretKey)
        const session = await stripe.checkout.sessions.create({
            line_items: [
              {
                price_data: {
                  unit_amount: Math.round(Price * 100),
                  currency: Currency,
                  product_data: {
                    name: ProductName && ProductName.length ? ProductName : DEFAULT_PRODUCT_NAME,
                    images: [Image && Image.length ? Image : DEFAULT_CUSTOMER_LOGO]
                  },
                },
                quantity: 1,
              },
            ],
            payment_intent_data: {
              metadata: {
                trans_start_time: getUtcTime(),
                user_id: `${_id}`,
                user_name: Username,
              }
            },
            mode: 'payment',
            customer_creation: 'always',
            ...(PrimaryEmail ? { customer_email: PrimaryEmail } : {}),
            success_url: `${SuccessUrl}`,
            cancel_url: `${CancelUrl}`,
          });
          const url = { url: session.url }
          return url;
    } catch(e) {
        console.log(e)
        throw new Error(e)
    }  
}

const createWebHookInStripe = async (data) => {
  try {
    addWebhookUrl(data)
    const webhookUrl = data.Stripe.WebhookURL
    const stripe = new Stripe(data.Stripe.SecretKey)
    const webhookResponse = await stripe.webhookEndpoints.create({
      enabled_events: ["charge.succeeded", "charge.failed"],
      url: webhookUrl,
    });
    data.Stripe.WebhookSecret = webhookResponse.secret;
    data.Stripe.WebhookID = webhookResponse.id;
    delete data.Stripe.WebhookURL;
  } catch (e) {
    console.log("Error in createWebHookInStripe: ", e);
    throw e;
  }  
}

const deleteWebHookInStripe = async (data) => {
  try {
    const webhookID = data.Stripe.WebhookID
    const stripe = new Stripe(data.Stripe.SecretKey)
    await stripe.webhookEndpoints.del(webhookID);
  } catch (e) {
    console.log("Error in deleteWebHookInStripe: ", e);
    throw e;
  }  
} 

module.exports = { generateStripeUrlFunction, createWebHookInStripe, deleteWebHookInStripe }
