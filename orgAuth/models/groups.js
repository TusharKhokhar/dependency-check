const { getObjectId: ObjectId } = require('../helpers/objectIdConvertion')
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

const Groups = {}

Groups.getGroup = async (db, customerID, groupName) => {
  try {
    const auth = await db.collection('Groups').findOne({ CustomerID: customerID, GroupName: { $regex: `^${groupName}$`, $options: 'i' }, IsActive: true, IsDeleted: false })
    return auth
  } catch (err) {
    throw new Error(err)
  }
}

Groups.getPermissionGroupByEasyBookingId = async (
  db,
  customerID,
  easyBookingGroupID
) => {
  try {
    const permissionGroup = await db
      .collection("Groups")
      .findOne({
        GroupType: "Permissions",
        EasyBookingGroupID: ObjectId.createFromHexString(easyBookingGroupID),
        CustomerID: ObjectId.createFromHexString(customerID),
        IsActive: true,
        IsDeleted: false,
      });
    return permissionGroup;
  } catch (err) {
    log.error("Failed to get permission group by EasyBooking group", err);
    throw new Error(err);
  }
};

module.exports = Groups