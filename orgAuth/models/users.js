
// // Users Model
const Users = {}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

Users.findUserByUserName = async (db, userName, requesterDomain, authProviderID) => {
  try {
    const baseQuery = {
      Username: { $regex: `^${escapeRegex(userName)}$`, $options: 'i' },
      TenantDomain: requesterDomain,
      IsActive: true,
      IsDeleted: false,
      GenerationTimestamp: { $exists: true }, // To distinguish internal providers, as users logging in with an internal provider do not have a GenerationTimestamp.
    };

    const projection = {
      UserName: 1,
      PrimaryEmail: 1,
      Password: 1,
      FirstName: 1,
      LastName: 1,
      Email: 1,
    };

    const user = await db.collection('Users').findOne(baseQuery, { ...projection });

    // This enables the creation of two different users with the same username but associated with different identity providers (IDPs).
    if (user?.AuthProviderID) {
      return await db.collection('Users').findOne(
        { ...baseQuery, AuthProviderID: authProviderID },
        { ...projection }
      );
    }

    return user;
  } catch (err) {
    throw new Error(err)
  }
}

Users.findUserByEmail = async (db, email, requesterDomain, authId) => {
  try {
    return await db.collection('Users').findOne({ PrimaryEmail: { $regex: `^${escapeRegex(email)}$`, $options: 'i' }, TenantDomain: requesterDomain, AuthProviderID: authId, IsActive: true, IsDeleted: false }, {
      UserName: 1,
      PrimaryEmail: 1,
      Password: 1,
      FirstName: 1,
      LastName: 1,
      Email: 1,
    })
  } catch (err) {
    throw new Error(err)
  }
}

Users.createUser = async (db, user, orgId) => {
  try {
    if (user && user.PrimaryEmail) {
      user.PrimaryEmail = user.PrimaryEmail.toLowerCase();
    }
    if (user && user?.Username) {
      user.Username = user.Username.toLowerCase();
    }
    const id = (await db.collection('Users').insertOne(user, { TenantDomain: orgId.toLowerCase() })).insertedId;
    user._id = id
    return user
  } catch (err) {
    throw new Error(err)
  }
}

Users.updateIat =  async(db, iat, id) => {
  return await db.collection('Users').updateOne({ _id: id }, { $set: { iat: iat } })
}

Users.update = async (db, user, id) => {
  if (user && user.PrimaryEmail) {
    user.PrimaryEmail = user.PrimaryEmail.toLowerCase();
  }
  return await db.collection('Users').updateOne({ _id: id }, { $set: user })
}

module.exports = Users
