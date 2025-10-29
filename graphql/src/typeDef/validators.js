const typeDef = `#graphql
    type Validator {
        _id: ID,
        Label: String,
        Validator: String,
        Description: String,
        Enabled: Boolean,
        ValidatorType: String,
        Customer: String,
        Tags: [String],
        PinEnabled: Boolean,
        Url: String,
        ApiKey: String,
        Secret: String,
        CreatedBy: String,
        IsDeleted: Boolean,
        IsActive: Boolean
    }
    
    input ValidatorInput {
        Label: String,
        Validator: String,
        Description: String,
        Enabled: Boolean,
        ValidatorType: String,
        Customer: String,
        Tags: [String],
        PinEnabled: Boolean,
        Url: String,
        ApiKey: String,
        Secret: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String
    }

    type ValidatorsResponse {
        validator: [Validator],
        total: Int
    }
    
    extend type Mutation {
        addValidator(addValidatorInput: ValidatorInput): Validator
        updateValidator(updateValidatorInput: ValidatorInput, validatorId: ID!): Response
        validatorDeleted(IsDeleted: Boolean, validatorId: ID): Response
        validatorStatus(IsActive: Boolean, validatorId: ID): Response
    }
    
    extend type Query {
        getValidators(paginationInput: PaginationData): ValidatorsResponse
        getValidator(validatorId: ID): Validator
    }
`

module.exports = typeDef
