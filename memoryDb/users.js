const {getDb} = require('../publicAuth/config/db')
const collectionName = 'Users'
const { faker } = require('../publicAuth/node_modules/@faker-js/faker');
const JWT = require('../publicAuth/node_modules/jsonwebtoken');
const bcrypt = require('../publicAuth/node_modules/bcryptjs');
const {apiKey} = require("../graphql/config/config");
const fs = require("fs");
const { getObjectId } = require('../publicAuth/helpers/objectIdConvertion');
const privateKey = fs.readFileSync('../publicAuth/config/jwtRS256.key')

module.exports = {
  addUser: async (
    groupIds,
    groupQuotas,
    customerId,
    tier,
    domainName,
    userName,
    password
  ) => {
    const mockPassword = password ? password : faker.internet.password();
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(mockPassword, salt);
    const db = await getDb();
    const userData = {
      Email: [],
      Tags: [],
      GroupID: groupIds,
      ApprovedUser: true,
      Mfa: false,
      IsActive: true,
      IsDeleted: false,
      Username: userName ? userName : faker.internet.userName(),
      PrimaryEmail: faker.internet.email(),
      CustomerID: customerId,
      CardNumber: ["1234"],
      Tier: tier,
      TenantDomain: domainName,
      Password: hash,
      FirstName: faker.internet.userName(),
      LastName: faker.internet.userName(),
      Mobile: "24324234235",
      __v: 0,
      MfaOption: {
        Email: false,
        Mobile: false,
      },
      GroupQuotas: groupQuotas,
      DebitBalance: 121,
      LoginSession: {
        web: 1716995497,
        mobile: 1709048789,
        kiosk: 1697549043,
        undefined: 1716989527,
      },
      Pin: "$2b$10$SMBzrLYkGJbPdKDyJSQb1.kzzxIxHuQLjLjWUrNj9i3166T7GLWeu",
      PIN: "$2b$10$22ku/xLUnhChcqRWMhdaBerxtPICDt0AUtRQPyzyL2GtUOIwlK4Pi",
    };
    const response = await db.collection(collectionName).insertOne(userData);
    response.password = mockPassword;
    return {
      ops: [userData],
      insertedId: response.insertedId,
      password: mockPassword,
    };
  },
  fetchToken: async (user) => {
    const db = await getDb();
    let userInfo = {};
    let iat = Math.floor(+new Date() / 1000);
    userInfo.FirstName = user.FirstName;
    userInfo.LastName = user.LastName;
    userInfo.CustomerID = user.CustomerID;
    userInfo.TenantDomain = user.TenantDomain;
    userInfo.Tier = user.Tier;
    userInfo._id = user._id;
    userInfo.sessionId = iat.toString();
    userInfo.iat = iat;
    userInfo.GroupID = user.GroupID;
    userInfo.isKiosk = false;
    user.Password = null;
    user.iat = iat;
    user.sessionId = Date.now().toString();
    const expiryTime = "2h";
    const token = await JWT.sign(userInfo, privateKey, {
      algorithm: "RS256",
      expiresIn: expiryTime,
    });
    const keyName = Object.keys(apiKey).find((k) => apiKey[k] === apiKey.web);
    const queryKey = `LoginSession.${keyName}`;
    await db
      .collection("Users")
      .updateOne({ _id: user._id }, { $set: { [queryKey]: iat } });
    return token;
  },
  findUser: async (userName, tenantDomain) => {
    const db = await getDb();
    return await db
      .collection("Users")
      .findOne({ Username: userName, TenantDomain: tenantDomain });
  },
  deleteUser: async (userName, tenantDomain) => {
    const db = await getDb();
    return await db
      .collection("Users")
      .deleteOne({ Username: userName, TenantDomain: tenantDomain });
  },
  findUserByHashId: async (hashId, tenantDomain) => {
    const db = await getDb();
    return await db
      .collection("Users")
      .findOne({
        HashID: hashId,
        TenantDomain: tenantDomain,
        IsDeleted: false,
      });
  },
  deleteAllUsers: async () => {
    const db = await getDb();
    return await db.collection("Users").deleteMany({});
  },
  findUserById: async (id) => {
    const db = await getDb();
    return await db.collection("Users").findOne({ _id: id });
  },
  findUserQuery: async (query) => {
    const db = await getDb();
    return await db.collection("Users").findOne(query);
  },
  updateUser: async (updateObject, userId) => {
    const db = await getDb();
    return await db.collection("Users").updateOne(
      { _id: getObjectId.createFromHexString(userId) },
      {
        $set: updateObject,
      }
    );
  },
  findAndUpdateUser : async (CustomerId, updateObject) => {
      const db = await getDb()
      return await db.collection('Users').findOneAndUpdate({ CustomerID: CustomerId }, { $set: updateObject })
  },
  getUserByCustomerId: async (customerId) => {
    const db = await getDb();
    return await db.collection("Users").findOne({
        CustomerID: getObjectId.createFromHexString(customerId),
        IsDeleted: false,
        IsActive: true
    });
  },
  findByIdAndUpdateUser : async (userId, updateObject) => {
      const db = await getDb()
      return await db.collection('Users').findOneAndUpdate({ _id: userId }, { $set: updateObject },{ returnDocument: 'after' })
  },
};
