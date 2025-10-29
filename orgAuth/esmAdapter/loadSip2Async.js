const SIP2 = {};

const initializeSIP2 = async () => {
  try {
    const module = await import("sip2-async");
    SIP2.Client = module.default.Client;
    SIP2.LoginRequest = module.default.LoginRequest;
    SIP2.PatronInformationRequest = module.default.PatronInformationRequest;
    SIP2.SCStatusRequest = module.default.SCStatusRequest
  } catch (error) {
    console.error("Failed to load the SIP2 module:", error);
  }
};

initializeSIP2();

module.exports = SIP2;
