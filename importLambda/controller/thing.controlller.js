const { addCreateTimeStamp, escapeRegex } = require("../utils");
const { getDb } = require("../config/db");
const config  = require("../config/config");
const { ObjectId } = require("mongodb");
const iotHandler = require("../services/iotResourceHandler");

const validateAndInsertThing = async (addThingInput, CustomerID) => {
  const {
    Display,
    Thing,
    Label,
    ThingType,
    LocationName,
    DeviceName,
    AutoSelectPrinter,
    DebugLog,
    ClearLogsAfter,
    TimeOut,
    PJLPrint,
    PdfiumPrint,
    MultithreadPrint,
    GuestCopy,
    GuestScan,
    PrintUSBAsGuest,
    PrintUSBWithAccount,
    AutomaticSoftwareUpdate = true,
    Tags,
    DisplayQrCode,
    PromptForAccount
  } = addThingInput;
  const db = await getDb();
  if (!Display || !Thing || !ThingType || !LocationName) {
    throw new Error("Missing required fields");
  }
  const locationData = await db.collection("Locations").findOne({Location: LocationName, CustomerID: CustomerID, IsDeleted: false});
  if (!locationData) {
    throw new Error("Location not found");
  }
  const deviceData = await db.collection("Devices").findOne({Device: DeviceName, CustomerID: CustomerID, IsDeleted: false});
  if (!deviceData) {
    throw new Error("Device not found");
  }
  const {
    loginOptions,
    MessageBox,
    SupportedIdentityProviderID,
  } = await loginOptionValidationAndFormatData(addThingInput, db, CustomerID)
  const LocationID = locationData._id
  const DeviceID = [deviceData._id]
  let newThing = {
    Label: Display,
    Thing,
    ThingType,
    Enabled: true,
    CustomerID,
    LocationID: locationData._id,
    DeviceID: [deviceData._id ]|| [],
    IsBulkImport: true,
    AutoSelectPrinter: AutoSelectPrinter?.toLowerCase() === "true",
    DebugLog: DebugLog?.toLowerCase() === "true",
    PrintUSBAsGuest: PrintUSBAsGuest?.toLowerCase() === "true",
    PrintUSBWithAccount: PrintUSBWithAccount?.toLowerCase() === "true",
    ClearLogsAfter: ClearLogsAfter ? parseInt(ClearLogsAfter) : 7,
    TimeOut: TimeOut ? parseInt(TimeOut) : 60,
    DisplayQrCode: DisplayQrCode?.toLowerCase() === "true",
    IsDeleted: false,
    IsActive: true,
    PJLPrint: PJLPrint?.toLowerCase() === "true",
    PdfiumPrint: PdfiumPrint?.toLowerCase() === "true",
    MultithreadPrint: MultithreadPrint?.toLowerCase() === "true",
    GuestCopy: GuestCopy?.toLowerCase() === "true",
    GuestScan: GuestScan?.toLowerCase() === "true",
    AutomaticSoftwareUpdate: AutomaticSoftwareUpdate?.toLowerCase() === "true",
    PromptForAccount: PromptForAccount?.toLowerCase() === "true",
    LoginOptions: loginOptions,
    MessageBox: MessageBox,
    SupportedIdentityProviderID: SupportedIdentityProviderID,
    Tags: Tags && Tags!== '' ? Tags?.split(',') : []
  };
  if (Number.isNaN(newThing?.TimeOut)) {
    newThing.TimeOut = 60
  } 
  if (Number.isNaN(newThing?.ClearLogsAfter)) {
    newThing.ClearLogsAfter = 7
  }
  newThing = addCreateTimeStamp(newThing);
  try {
    const validateThing = await db.collection("Things").findOne({
      CustomerID: ObjectId.createFromHexString(CustomerID.toString()),
      $or: [
          { Label: { $regex: `^${escapeRegex(Display)}$`, $options: 'i' } },
          { Thing: { $regex: `^${escapeRegex(Thing)}$`, $options: 'i' } }
      ],
      IsDeleted: false,
    });

    if (ThingType && ThingType.toLowerCase() === "kiosk" && DeviceID.length > 1) {
      throw new Error("Kiosk can be associated with one device");
    }

    if (validateThing) {
      throw new Error("Thing already exists");
    } else {
      const commonDb = await getDb();
      const { ThingType: supportedThingTypes } = await commonDb
        .collection("Dropdowns")
        .findOne({}, { ThingType: 1 });

      if (!supportedThingTypes.includes(ThingType)) {
        throw new Error("Thing type not supported");
      }

      const licenseData = await commonDb
        .collection("Licenses")
        .findOne({ CustomerID: ObjectId.createFromHexString(CustomerID.toString()) });

      if (!licenseData) throw new Error("License not configured");

      const thingArray = await db
        .collection("Things")
        .find(
          {
            CustomerID,
            ThingType,
            IsActive: true,
            IsDeleted: false,
          },
          { ThingType: 1 }
        )
        .toArray();

      let limitObj = {};
      licenseData.ThingsLimit.forEach((data) => {
        if (data.ThingType === ThingType) {
          limitObj = data;
        }
      });

      if (Object.keys(limitObj).length === 0) {
        throw new Error("License not configured for this type");
      }

      if (thingArray.length >= limitObj.ThingNumber) {
        throw new Error("License limit things");
      } else {
        const printDeliveryFound =
          ThingType === "print delivery station"
            ? await db.collection("Things").findOne({
                LocationID: ObjectId.createFromHexString(LocationID.toString()),
                ThingType: "print delivery station",
                IsDeleted: false,
              })
            : false;

        if (printDeliveryFound) {
          throw new Error("PDS already exists");
        } else {
          const { insertedId } = await db.collection("Things").insertOne(newThing);

          if (DeviceID) {
            await deviceMapping({ DeviceID, db, thingId: insertedId, update: false });
          }

          const data = await db.collection("Things").findOne({ _id: insertedId });
          await mapRedundantIds(data, db, null);
          data.iotThingName = `${data._id}-${Date.now()}`;
          const primaryRegion = await iotHandler.createIoTResources(data, config.primaryRegion);
          data.PrimaryRegion = {
            PolicyName: primaryRegion.policyData.policyName,
            ThingArn: primaryRegion.iotData.thingArn,
            ThingName: primaryRegion.iotData.thingName,
            ThingID: primaryRegion.iotData.thingId,
            CertificateID: primaryRegion.certificateData.certificateId,
            EncryptedPrivateKey: primaryRegion.privateKey,
          };

          await iotHandler.createIoTResourcesSecondaryRegion(
            data,
            config.secondaryRegion,
            primaryRegion.deviceCerts,
            primaryRegion.devicePrivateKey
          );

          await db.collection("Things").updateOne({ _id: insertedId }, { $set: data });
          return data;
        }
      }
    }
  } catch (error) {
    console.error('error=========',error)
    throw new Error(error);
  }
};

const deviceMapping = async ({ DeviceID, db, thingCurrent, thingId, update }) => {
  try {
    const incomingDeviceList = DeviceID && DeviceID.length > 0
      ? await Promise.all(DeviceID.map((dev) => ObjectId.createFromHexString(dev.toString())))
      : [];
    thingId = ObjectId.createFromHexString(thingId.toString());

    if (update && incomingDeviceList && thingCurrent.DeviceID) {
      const allDevices = await db.collection("Devices").find({ ThingID: thingId }, { QrCode: 0 }).toArray();
      const arrayOfDeviceIds = allDevices.map((obj) => obj._id.toString());

      const devicesUnassigned = allDevices
        .map((obj) => (!DeviceID.includes(obj._id.toString()) ? obj._id : undefined))
        .filter((fi) => fi !== undefined);

      let devicesAssigned = DeviceID.filter((obj) => !arrayOfDeviceIds.includes(obj));
      devicesAssigned = devicesAssigned.map((obj) => ObjectId.createFromHexString(obj.toString()));

      const noChangeInAssignment = incomingDeviceList.toString() === arrayOfDeviceIds.toString();
      try {
        if (!noChangeInAssignment) {
          if (devicesUnassigned.length > 0) {
            await db.collection("Things").updateMany(
              { _id: ObjectId.createFromHexString(thingId.toString()) },
              { $pull: { DeviceID: { $in: devicesUnassigned } } },
              { multi: true }
            );
            await db.collection("Devices").updateMany(
              { _id: { $in: devicesUnassigned } },
              { $set: { ThingID: null } },
              { multi: true }
            );
          }
          if (devicesAssigned.length > 0) {
            await changeDeviceAssociation(db, devicesAssigned, thingId);
          }
        }
      } catch (e) {
        console.log('Ignored error: ',e.toString());
      }
    } else {
      await changeDeviceAssociation(db, incomingDeviceList, thingId);
    }
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};

const changeDeviceAssociation = async (db, DeviceID, thingId) => {
  try {
    const deviceData = await db.collection("Devices").find({ _id: { $in: DeviceID } }).toArray();
    const thingIdsToBeDisassociated = deviceData.map((dev) => dev.ThingID);

    if (thingIdsToBeDisassociated.length > 0) {
      await db.collection("Things").updateMany(
        { _id: { $in: thingIdsToBeDisassociated } },
        { $pull: { DeviceID: { $in: DeviceID } } },
        { multi: true }
      );
    }

    await db.collection("Devices").updateMany(
      { _id: { $in: DeviceID } },
      { $set: { ThingID: ObjectId.createFromHexString(thingId.toString()) } },
      { multi: true }
    );
  } catch (e) {
    console.log(e.toString());
  }
};

const mapRedundantIds = async (thingCurrent, db, thingNew) => {
  if (
    thingCurrent?.RedundancySetting?.Redundancy &&
    thingCurrent?.RedundancySetting?.Primary &&
    thingNew?.RedundancySetting?.ThingsAssociated
  ) {
    await db.collection("Things").updateMany(
      { IsDeleted: false, _id: { $in: thingNew.RedundancySetting.ThingsAssociated }, CustomerID: thingCurrent.CustomerID },
      { $set: { "RedundancySetting.PrimaryThingID": thingCurrent.RedundancySetting.PrimaryThingID } },
      { multi: true }
    );
  } else if (
    thingCurrent?.RedundancySetting?.Redundancy &&
    !thingCurrent?.RedundancySetting?.Primary &&
    thingNew.RedundancySetting.PrimaryThingID
  ) {
    await db.collection("Things").updateOne(
      { IsDeleted: false, _id: thingNew.RedundancySetting.PrimaryThingID, CustomerID: thingCurrent.CustomerID },
      { $addToSet: { "RedundancySetting.PrimaryThingID": thingCurrent.RedundancySetting.PrimaryThingID } }
    );
  } else if (
    thingCurrent?.RedundancySetting?.Redundancy === false &&
    thingNew?.RedundancySetting?.Redundancy !== thingCurrent?.RedundancySetting?.Redundancy
  ) {
    await db.collection("Things").updateMany(
      { IsDeleted: false, _id: { $in: thingNew.RedundancySetting.ThingsAssociated }, CustomerID: thingCurrent.CustomerID },
      { $set: { "RedundancySetting.PrimaryThingID": null } },
      { multi: true }
    );
  }
};

const loginOptionValidationAndFormatData = async (data, db, customerId) => {
  const loginOptions = []
  let identityProviders = await db.collection('AuthProviders').find({CustomerID: customerId, IsDeleted: false,
    ProviderName: {$in: [data?.LoginOptionIdentityProviderOne,
        data?.LoginOptionIdentityProviderTwo,
        data?.LoginOptionIdentityProviderThree,
        data?.LoginOptionIdentityProviderFour
      ]} }).toArray()
  if (data?.LoginOptionIdentityProvider?.toLowerCase() === 'true' && identityProviders?.length === 0 &&
    data?.LoginOptionIdentityProviderOne) {
    throw new Error('Identity Providers not found')
  }
  identityProviders = identityProviders?.map((obj) => obj._id) || []
  let identityProvidersExternal = {};
  if (data?.ExternalCardValidation?.toLowerCase() === 'true') {
    identityProvidersExternal = await db.collection('AuthProviders').findOne({
      CustomerID: customerId,
      IsDeleted: false,
      ProviderName: data?.ExternalCardIdpName
    });
  }
  if (data?.ExternalCardValidation?.toLowerCase() === 'true' && Object.keys(identityProvidersExternal).length === 0) {
    throw new Error('External Card Identity Provider not found')
  }
  if (data?.LoginOptionReleaseCode.toLowerCase() === 'true') {
    loginOptions.push({
      "LoginOptionType" : "Release_Code",
      "LoginLabelText" : data?.LoginOptionReleaseCodeLabel,
    });
  }
  if (data?.LoginOptionGuestName.toLowerCase() === 'true') {
    loginOptions.push({
      "LoginOptionType" : "Guest_Name",
      "LoginLabelText" : data?.LoginOptionGuestLabel,
    });
  }
  if (data?.LoginOptionUsername.toLowerCase() === 'true') {
    loginOptions.push({
      "LoginOptionType" : "Username",
      "LoginLabelText" : data?.LoginOptionUsernameLabel,
    });
  }
  if (data?.LoginOptionCardNumber.toLowerCase() === 'true') {
    loginOptions.push({
      "LoginOptionType" : "CardNumber",
      "LoginLabelText" : data?.LoginOptionCardNumberPin.toLowerCase(),
      "ExternalCardValidation" : data?.ExternalCardValidation?.toLowerCase() === 'true',
      "ExternalCardIdp" : identityProvidersExternal ? [identityProvidersExternal?._id] : [],
    });
  }
  if (data?.LoginOptionIdentityProvider.toLowerCase() === 'true') {
    loginOptions.push({
      "LoginOptionType" : "Login_from_Identity_Providers",
      "LoginLabelText" : data?.LoginOptionIdentityProvider.toLowerCase()
    });
  }
  return {
    loginOptions,
    MessageBox: data?.LoginOptionReleaseCodeHomeMessage,
    SupportedIdentityProviderID: identityProviders,
  }
}

module.exports = { validateAndInsertThing };