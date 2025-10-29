const Groups = {}

Groups.getGroup = async (db, customerID, groupName) => {
  try {
    const auth = await db.collection('Groups').findOne({ CustomerID: customerID, GroupName: { $regex: `^${groupName}$`, $options: 'i' }, IsActive: true, IsDeleted: false })
    return auth
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = Groups