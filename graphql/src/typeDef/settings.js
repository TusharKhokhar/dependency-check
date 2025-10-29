const typeDef = `#graphql
    type Setting {
        _id: ID,
        Label: String,
        Setting: String,
        Tags: [String],
        CreatedBy: String,
        IsDeleted: Boolean,
        IsActive: Boolean
    }
    
    input SettingInput {
        Label: String,
        Setting: String,
        Tags: [String],
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String
    }

    type SettingsResponse {
        setting: [Setting],
        total: Int
    }
    
    extend type Mutation {
        addSetting(addSettingInput: SettingInput): Setting
        updateSetting(updateSettingInput: SettingInput, settingId: ID!): Response
        settingDeleted(IsDeleted: Boolean, settingId: ID): Response
        settingStatus(IsActive: Boolean, settingId: ID): Response
    }
    
    extend type Query {
        getSettings(paginationInput: PaginationData): SettingsResponse
        getSetting(settingId: ID): Setting
    }
`

module.exports = typeDef
