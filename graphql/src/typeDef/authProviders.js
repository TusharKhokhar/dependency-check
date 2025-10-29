const typeDef = `#graphql

type AuthProvider {
    _id: ID,
    CustomerID: ID,
    ProviderName: String,
    OrgID: String,
    AuthProvider: AuthProviderOptions,
    SamlConfig: SamlConfigSchema,
    OpenIdConfig: OpenIdConfigSchema,
    DefaultGroupID: ID,
    DefaultGroupData: GroupDataSchema,
    Mappings: MappingsSchema,
    GroupId: GroupIdSchema,
    CustomerData: CustomerDataSchema,
    CustomerName: String,
    CreatedBy: String,
    IsDeleted: Boolean,
    Tags: [String],
    DisplayOnPortal: Boolean,
    LdapConfig: LdapConfigSchema,
    AadConfig: AadConfigSchema,
    GSuiteConfig: GSuiteConfigSchema,
    SirsiConfig: SirsiConfigSchema,
    InternalLoginConfig: InternalLoginConfigSchema,
    InnovativeConfig: InnovativeConfigSchema,
    ExternalCardValidationConfig: ExternalCardValidationConfigSchema,
    WkpConfig: WkpSchema,
    AssociatedIdentityProvider: ID,
    CallbackUrl: String,
    PolarisConfig: PolarisConfigSchema,
    LabelText: String,
    DefaultGroupName: String,
    TokenExpiry: Int,
    IsActive: Boolean,
    Sip2Config: Sip2ConfigSchema,
    GroupAssignmentRules: [GroupAssignmentRulesSchema],
    CustomFieldsEnabled: Boolean,
    AllowUserCreation: Boolean,
    CustomFields: [CustomFieldSchema]
}

type RulesSchema {
    Field: String,
    Match: TypeMatch,
    Condition: TypeCondition,
    Value: String
}

type SubGroupSchema {
    Name: String,
    Active: Boolean,
    Rules: [RulesSchema]
}

type GroupAssignmentRulesSchema {
    GroupName: String,
    Priority: Int,
    Enabled: Boolean,
    SubGroups: [SubGroupSchema]
}

input RulesInput {
    Field: String,
    Match: TypeMatch,
    Condition: TypeCondition,
    Value: String
}

input SubGroupInput {
    Name: String,
    Active: Boolean,
    Rules: [RulesInput]
}

input GroupAssignmentRulesInput {
    GroupName: String!,
    Priority: Int!,
    Enabled: Boolean,
    SubGroups: [SubGroupInput] 
}

enum TypeCondition {
    equal_to,
    not_equal_to,
    older_than_age,
    younger_than_age,
    between_age
}

enum TypeMatch {
    single,
    multi
}

input AuthProviderInput {
    CustomerID: ID!,
    ProviderName: String!,
    OrgID: String,
    AuthProvider: AuthProviderOptions!,
    SamlConfig: SamlConfigInput,
    OpenIdConfig: OpenIdConfigInput,
    InternalLoginConfig: InternalLoginConfigInput,
    DefaultGroupID: ID!,
    Mappings: MappingsInput!,
    GroupId: GroupIdInput,
    DisplayOnPortal: Boolean,
    AllowUserCreation: Boolean,
    CreatedBy: String,
    IsDeleted: Boolean,
    Tags: [String],
    LdapConfig: LdapConfigInput,
    AadConfig: AadConfigInput,
    GSuiteConfig: GSuiteConfigInput,
    SirsiConfig: SirsiConfigInput,
    InnovativeConfig: InnovativeConfigInput,
    PolarisConfig: PolarisConfigInput,
    ExternalCardValidationConfig: ExternalCardValidationInput,
    WkpConfig: WkpInput,
    AssociatedIdentityProvider: ID,
    LabelText: String,
    DefaultGroupName: String,
    TokenExpiry: Int,
    IsActive: Boolean,
	Sip2Config: Sip2ConfigInput,
    GroupAssignmentRules: [GroupAssignmentRulesInput],
    CustomFieldsEnabled: Boolean,
    CustomFields: [CustomFieldInput]
}

type InternalLoginConfigSchema {
    UsernameLabel: String,
    PasswordLabel: String
}

input InternalLoginConfigInput {
    UsernameLabel: String,
    PasswordLabel: String
}

type PolarisConfigSchema {
    Host: String,
    PAPIAccessId: String,
    PAPIAccessKey: String
    LoginType: LoginTypePolaris,
    BarCodeLabelText: String,
    PinLabelText: String,
    Username: String,
    Password: String,
    Domain: String
}

input PolarisConfigInput {
    Host: String!,
    PAPIAccessId: String!,
    PAPIAccessKey: String!,
    LoginType: LoginTypePolaris!,
    BarCodeLabelText: String,
    PinLabelText: String,
    Username: String,
    Password: String,
    Domain: String
}

type SirsiConfigSchema {
    ServerBaseURL: String,
    AppId: String,
    ClientId: String,
    LoginType: String,
    BarCode: String,
    Pin: String,
    BarCodeLabelText: String,
    PinLabelText: String,
    Username: String,
    Password: String
}

enum LoginTypePolaris {
    BarcodeWithPin,
    BarcodeOnly
}

input SirsiConfigInput {
    ServerBaseURL: String,
    AppId: String,
    ClientId: String,
    LoginType: String,
    BarCode: String,
    Pin: String,
    BarCodeLabelText: String,
    PinLabelText: String,
    Username: String,
    Password: String
}

type InnovativeConfigSchema {
    ClientId: String,
    ClientSecret: String,
    ServerBaseURL: String,
    LoginType: String,
    BarCode: String,
    Pin: String,
    BarCodeLabelText: String,
    PinLabelText: String,
    Username: String,
    Password: String
}

input ExternalCardValidationInput {
    ClientId: String!,
    ClientSecret: String!,
    AuthorizationEndpoint: String,
    DiscoveryDocument: String,
    AdditionalScope: String,
    MaxAge: Int,
    AcrValues: String,
    Prompt: [PromptEnum],
    Display: DisplayEnum,
    NonceEnabled: Boolean
}

type ExternalCardValidationConfigSchema {
    ClientId: String,
    ClientSecret: String,
    AuthorizationEndpoint: String,
    DiscoveryDocument: String,
    AdditionalScope: String,
    MaxAge: Int,
    AcrValues: String,
    Prompt: [PromptEnum],
    Display: DisplayEnum,
    NonceEnabled: Boolean,
}

input InnovativeConfigInput {
    ClientId: String,
    ClientSecret: String,
    ServerBaseURL: String,
    LoginType: String,
    BarCode: String,
    Pin: String,
    BarCodeLabelText: String,
    PinLabelText: String,
    Username: String,
    Password: String
}

type AadConfigSchema {
    ClientId: String,
    TenantId: String,
    ClientSecret: String
}

input AadConfigInput {
    ClientId: String,
    TenantId: String,
    ClientSecret: String
}

type GSuiteConfigSchema {
    ClientId: String,
    ClientSecret: String
}

input GSuiteConfigInput {
    ClientId: String,
    ClientSecret: String
}

type LdapConfigSchema {
    Protocol: String,
    Host: String,
    Port: String,
    CaCert: String,
    BindDn: String,
    BindCredential: String,
    LdapBase: String,
    PrimaryKey: String,
    UsernameLabelText: String,
    PasswordLabelText: String
}

input LdapConfigInput {
    Protocol: String,
    Host: String,
    Port: String,
    CaCert: String,
    BindDn: String,
    BindCredential: String,
    LdapBase: String,
    PrimaryKey: String,
    UsernameLabelText: String,
    PasswordLabelText: String
}

type MappingsSchema {
    Username: String,
    PrimaryEmail: String,
    FirstName: String,
    LastName: String,
    CardNumber: String,
    Mobile: String,
    GroupName: String,
    Account: String
}

input MappingsInput {
    Username: String!,
    PrimaryEmail: String!,
    FirstName: String!,
    LastName: String!,
    CardNumber: String!,
    Mobile: String!,
    GroupName: String!,
    Account: String,
}

type GroupIdSchema {
    name: String,
    id: ID
}

input GroupIdInput {
    name: String,
    id: ID
}

type SamlConfigSchema {
    LoginUrl: String,
    NameIdFormat: String,
    Certificate: String
}

input SamlConfigInput {
    LoginUrl: String,
    NameIdFormat: String,
    Certificate: String
}

type OpenIdConfigSchema {
    ClientID: String,
    ResponseType: String,
    Scope: String,
    RedirectUri: String,
    GrantType: String,
    ClientSecret: String,
    Distribution: String,
    Authn: String,
    PrivateKey: String,
    PublicKey: String,
    DiscoveryDocument: String,
    CustomAuthorizationEndpoint: String,
    SessionDuration: String,
    BaseUrl: String,
    CallbackPath: String,
    Authz: String,
    AdditionalScope: String,
    MaxAge: Int,
    AcrValues: String,
    Prompt: [PromptEnum],
    Display: DisplayEnum,
    NonceEnabled: Boolean
}

type CustomFieldSchema {
    FieldName: String,
    FieldValue: String,
    FieldType: CustomValueType
}
 
input CustomFieldInput {
    FieldName: String,
    FieldValue: String,
    FieldType: CustomValueType
}
 
enum CustomValueType {
    static,
    dynamic
}
 
enum PromptEnum {
    none
    login
    consent
    select_account
}

enum DisplayEnum {
    page
    popup
    touch
    wap
}

input OpenIdConfigInput {
    ClientID: String,
    ResponseType: String,
    Scope: String,
    RedirectUri: String,
    GrantType: String,
    ClientSecret: String,
    Distribution: String,
    Authn: String,
    PrivateKey: String,
    PublicKey: String,
    DiscoveryDocument: String,
    CustomAuthorizationEndpoint: String,
    SessionDuration: String,
    BaseUrl: String,
    CallbackPath: String,
    Authz: String,
    AdditionalScope: String,
    MaxAge: Int,
    AcrValues: String,
    Prompt: [PromptEnum],
    Display: DisplayEnum,
    NonceEnabled: Boolean
}

type Sip2ConfigSchema {
    Host: String,
    Port: String,
    Username: String,
    Password: String,
    TerminalPassword: String,
    InstitutionID: String,
    LocationCode: String,
    LoginEnabled: Boolean,
    SslEnabled: Boolean,
    LoginType: LoginTypeSip2,
    BarCodeLabelText: String,
    PinLabelText: String,
}
input Sip2ConfigInput {
    Host: String!,
    Port: String!,
    Username: String,
    Password: String,
    TerminalPassword: String,
    InstitutionID: String,
    LocationCode: String,
    LoginEnabled: Boolean,
    SslEnabled: Boolean,
    LoginType: LoginTypeSip2!,
    BarCodeLabelText: String,
    PinLabelText: String,
}

type WkpSchema {
    ClientId: String,
    ClientSecret: String,
    Scope: String,
    TokenEndpoint: String,
    OcpApimSubscriptionKey: String,
    WkpAuthEndpoint: String,
    PinLabelText: String
}

input WkpInput {
    ClientId: String,
    ClientSecret: String,
    Scope: String,
    TokenEndpoint: String,
    OcpApimSubscriptionKey: String,
    WkpAuthEndpoint: String,
    PinLabelText: String
}

enum LoginTypeSip2 {
    BarcodeWithPin,
    BarcodeOnly
}

enum AuthProviderOptions {
    saml,
    oidc,
    internal,
    ldap,
    ldaps,
    azuread,
    gsuite,
    innovative,
    sirsi,
    polaris,
    sip2,
    externalCardValidation,
    wkp
}

type AuthProvidersResponse {
    authProvider: [AuthProvider],
    total: Int
}

extend type Mutation {
    addAuthProvider(addAuthProviderInput: AuthProviderInput): AuthProvider
    updateAuthProvider(updateAuthProviderInput: AuthProviderInput, authProviderId: ID!, customerId: ID): Response
    authProviderDeleted(IsDeleted: Boolean, authProviderId: ID, customerId: ID): Response
    authProviderStatus(IsActive: Boolean, authProviderId: ID, customerId: ID): Response
}

extend type Query {
    getAuthProviders(paginationInput: PaginationData, customerIds: [ID]): AuthProvidersResponse
    getAuthProvider(authProviderId: ID, customerId: ID): AuthProvider
    getInternalAuthProvider(customerId: ID): Boolean
    buildIdPMetadata (customerId: ID, authProviderId: ID): Response
}
`
module.exports = typeDef
