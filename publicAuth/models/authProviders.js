// Things Model
const AuthProviders = {};

// Get internal auth provider's token expiry for a customer
AuthProviders.findInternalUser = async (db, customerID) => {
  return await db.collection("AuthProviders").findOne(
    {
      CustomerID: customerID,
      AuthProvider: "internal",
      IsActive: true,
      IsDeleted: false,
    },
    {
      projection: { TokenExpiry: 1 },
    }
  );
};

module.exports = AuthProviders;
