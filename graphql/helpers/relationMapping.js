const { Things, Devices, JobLists, Users, Groups } = require('../models/collections')

module.exports.relationMapping = {
  customers: [],
  customizations: [],
  customizationText: [],
  customPermissions: [],
  partners: [],
  devices: [
    {
      collectionName: Things,
      reference: 'DeviceID',
      required: true,
      isArray: true
    },
    {
      collectionName: Things,
      reference: 'DefaultDevice',
      required: true,
      isArray: false
    },
    {
      collectionName: Groups,
      reference: 'DeviceID',
      required: true,
      isArray: true
    }
  ],
  dropdowns: [],
  groups: [{
    collectionName: Users,
    reference: 'GroupID',
    required: true,
    isArray: true
  }, {
    collectionName: Devices,
    reference: 'GroupID',
    required: true,
    isArray: true
  }, {
    collectionName: Groups,
    reference: 'AssociatedQuotaBalance',
    required: true,
    isArray: true
  }, {
    collectionName: Groups,
    reference: 'EasyBookingGroupID',
    required: true,
    isArray: false
  }
  ],
  jobList: [],
  licensing: [],
  locations: [{
    collectionName: JobLists,
    reference: 'DefaultLmsValidateThing',
    required: true,
    isArray: false
  },
  {
    collectionName: Devices,
    reference: 'LocationID',
    required: true,
    isArray: false
  },
  {
    collectionName: Things,
    reference: 'LocationID',
    required: true,
    isArray: false
  }

  ],
  permissions: [],
  publicUploads: [],
  roles: [
    {
      collectionName: Groups,
      reference: 'RoleType',
      required: true,
      isArray: false
    }
  ],
  things: [{
    collectionName: Devices,
    reference: 'ThingID',
    required: true,
    isArray: false
  },
  {
    collectionName: JobLists,
    reference: 'DefaultLmsValidateThing',
    required: true,
    isArray: false
  }
  ],
  usages: [],
  payments: [],
  users: [],
  authProviders: [],
  versions: []
}
