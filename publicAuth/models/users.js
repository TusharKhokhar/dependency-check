const Bcrypt = require('bcryptjs');
const {apiKey} = require('../config/config');
const { escapeRegex } = require('../helpers/util');

// Users Model
const Users = {}

// update user
Users.updateUserMfa = async ({ otp, expiry, userId, db }) => {
  return await db.collection('Users').updateOne({ _id: userId }, { $set: { OtpPasswordExpires: expiry, Otp: otp } })
}
// update user
Users.updateUserMfaToken = async ({ mfaToken, userId, db }) => {
  return await db.collection('Users').updateOne({ _id: userId }, { $set: { MfaToken: mfaToken } })
}

// update user
Users.updateUserReset = async ({ resetToken, expiry, userId, hashPassword, db }, callback) => {
  const setCondition = { ResetPasswordExpires: expiry, ResetPasswordToken: resetToken }
  if (hashPassword) {
    Object.assign(setCondition, { Password: hashPassword })
  }
  const updateUserResetData = await db.collection('Users').updateOne({ _id: userId }, { $set: setCondition })
  callback(null, updateUserResetData)
}

/**
 * Method to compare password.
 * @param candidatePassword
 * @param hash
 * @param callback
 */
Users.comparePassword = ({ candidatePassword, hash }) => {
  return new Promise((resolve, reject) => {
    Bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
      if (err) {
        reject(err)
      }
      resolve(isMatch)
    })
  })
}

Users.findUserByUserName = async (db, userName, requesterDomain) => {
  try {
    return await db.collection('Users').findOne({ Username: { $regex: `^${escapeRegex(userName)}$`, $options: 'i' }, TenantDomain: requesterDomain, IsDeleted: false }, {
      UserName: 1,
      Password: 1,
      FirstName: 1,
      LastName: 1,
      CustomerID: 1,
      Email: 1,
      LoginAttemptCount: 1
    })
  } catch (err) {
    throw new Error(err)
  }
}

//HashID and GenerationTimestamp

Users.findUserByHashId = async (db, hashId, requesterDomain) => {
  try {
    const user = await db.collection('Users').findOne({ HashID: hashId, TenantDomain: requesterDomain, IsDeleted: false }, {
      UserName: 1,
      FirstName: 1,
      LastName: 1,
      Email: 1,
      LoginAttemptCount: 1
    })
    user ? await db.collection('Users').updateOne({ HashID: hashId, TenantDomain: requesterDomain, IsDeleted: false }, {
        $set: {HashID: null}
    }) : null
    return user
  } catch (err) {
    throw new Error(err)
  }
}

Users.findResetToken = async (token, db, callback) => {
  const findResetTokenData = await db.collection('Users').findOne({ ResetPasswordToken: token, ResetPasswordExpires: { $gt: Date.now() } })
  callback(null, findResetTokenData)
}

Users.findOtp = async (otp, userId, db, callback) => {
  const findOtpData = await db.collection('Users').findOne({ Otp: otp, _id: userId, OtpPasswordExpires: { $gt: Date.now() } })
  callback(null, findOtpData)
}

Users.updateIat = async (db, iat, id, api) => {
  const keyName = Object.keys(apiKey).find(k=>apiKey[k]===api);
  const queryKey = `LoginSession.${keyName}`
  return await db.collection('Users').updateOne({ _id: id }, { $set: { [queryKey]: iat }})
}

Users.updateLoginAttempt = async (db, id) => {
  return await db.collection('Users').updateOne({ _id: id }, { $inc: { LoginAttemptCount: 1 } })
}

Users.updateLoginAttemptSuccess = async (db, id) => {
  return await db.collection('Users').updateOne({ _id: id }, { $set: { LoginAttemptCount: 0 } })
}

Users.lockAccount = async (db, id) => {
  return await db.collection('Users').updateOne({ _id: id }, { $set: { IsActive: false } })
}

module.exports = Users
