// redirect generates an appropriate redirect response.
const { setPkceConfigs } = require("../helpers/utils");

module.exports.getOidcRedirectPayload = async (authRequest, authorizationEndpoint) => {
    /*
        used PKCE (Proof Key for Code Exchange) for CSRF protection with client secret
        PKCE (RFC 7636) is an extension to the Authorization Code flow to prevent CSRF (Cross site request forgery, also known as XSRF) and authorization code injection attacks. PKCE is not a replacement for a client secret, and PKCE is recommended even if a client is using a client secret
        https://developer.okta.com/blog/2019/08/22/okta-authjs-pkce
    */
    const { pkceCodeVerifier, pkceCodeChallenge } = await setPkceConfigs();
    authRequest.code_challenge = pkceCodeChallenge, // "rTSkjQygpZ8QpxVJrY_EmTa-BETCetu5qnp_-ydTTAw"
    authRequest.code_challenge_method = 'S256';

    return {redirectUri: `${authorizationEndpoint}?${new URLSearchParams(authRequest).toString()}`, pkceCodeVerifier }
}