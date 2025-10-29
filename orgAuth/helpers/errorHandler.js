
// handleInvalidQueryString creates an unauthorized response with the proper formatting when
module.exports.handleInvalidQueryString = (queryString) => {
    const errors = {
        invalid_request: 'Invalid Request',
        unauthorized_client: 'Unauthorized Client',
        access_denied: 'Access Denied',
        unsupported_response_type: 'Unsupported Response Type',
        invalid_scope: 'Invalid Scope',
        server_error: 'Server Error',
        temporarily_unavailable: 'Temporarily Unavailable'
    };

    let error = '';
    let errorDescription = '';
    let errorUri = '';

    if (errors[queryString.error] != null) {
        error = errors[queryString.error];
    } else {
        error = queryString.error;
    }
    if (queryString.error_description != null) {
        errorDescription = queryString.error_description;
    } else {
        errorDescription = '';
    }

    if (queryString.error_uri != null) {
        errorUri = queryString.error_uri;
    } else {
        errorUri = '';
    }
    return { error, errorDescription, errorUri };
}
