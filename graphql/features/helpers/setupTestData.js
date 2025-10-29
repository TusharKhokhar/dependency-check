const { addNavigation } = require('../../../memoryDb/navigation');
const { addPermission } = require('../../../memoryDb/permissions');
const { addCustomPermission } = require('../../../memoryDb/customerPermissions');

async function setupTestData() {
    await addNavigation()
    await addPermission()
    await addCustomPermission()
}

module.exports = {
  setupTestData,
};
