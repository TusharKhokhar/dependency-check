// This file contains String constants.
module.exports = {
  LOGOUT_SUCCESS: 'You have successfully logged out',
  LOGIN_SUCCESS: 'You have successfully logged in',
  USER_ADDED_SUCCESSFULLY: 'User created successfully',
  USER_ACTIVATED: 'Specified user is activated',
  USER_DEACTIVATED: 'Specified user is deactivated',
  PASSWORD_RESET_SUCCESS: 'Successfully updated password, now please login with the new password.',
  PASSWORD_RESET_MAIL_SENT: 'Password reset verification link has been sent to your email successfully',
  VALID_TOKEN: 'You have valid token',
  NOTIFICATION_STATUS_UPDATED: 'You have updated notifications setting successfully',
  MFA_MAIL_SENT: 'Mfa Mail sent successfully',
  NOT_PROCCESS: 'Signup on this domain is not allowed',

  VALID_EMAIL_REGEX: '^[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,3}$',
  // VALID_EMAIL_REGEX: '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$',
  STATUS: 'success',

  REGISTER_SUCCESS: 'Registered successfully',
  ALREADY_REGISTER_SUCCESS: 'Already registered',
  CUSTOMER_SAVE_SUCCESS: 'Customer saved successfully',

  NOTIFICATION_SENT: 'Notification Sent',
  DELETE_NOTIFICATION: 'Notification is deleted successfully',
  CLEAR_ALL_NOTIFICATION: 'Clear all notifications successfully',
  PROFILE_IMAGE_URL: '/public/images/profiles/default.png',

  USER_UPDATED_SUCCESSFULLY: 'User updated successfully',
  Activated_Successfully: 'Activated Successfully',
  Removed_Successfully: 'Removed Successfully',
  Added_Successfully: 'Added Successfully',
  Deleted_Successfully: 'Api Key Deleted Successfully',
  Deactivated_Successfully: 'Deactivated Successfully',
  ACTION_NOT_ALLOWED: 'You are not allowed to perform this action',
  PASSWORD_UPDATED: 'Password Updated successfully',
  TRANSACTION_RESPONSE_ADDED: 'Transaction Response Added Successfully',
  TRANSACTION_ALREADY_EXISTS: "Transaction Response Already Exists",
  TRANSACTION_SUCCESSFUL: 'Your transaction has been successfully processed.',
  NAYAX_SOCKET_RESPONSE: 'Transaction response sent to web sockets connection.',
  /**
     * Email constant
     */
  SENDER_EMAIL: 'donotreply@scanez.com',
  DEFAULT_LOGO: '/public/images/logos/logo.png',

  /*
     *String constant used in user controller
     */
  Attribute_Name: 'name',
  Attribute_Email: 'email',
  Attribute_First_Name: 'custom:FirstName',
  Attribute_Last_Name: 'custom:LastName',
  Attribute_Customer: 'custom:Customer',
  Attribute_Role: 'custom:role',
  Attribute_TenantDomain: 'custom:TenantDomain',
  Attribute_Email_Verified: 'email_verified',

  IMAGE_FILE_NAME: 'logo.png',
  JOB_SENT_SUCCESSFULLY: 'Job status sent successfully',
  STATUS_SENT_SUCCESSFULLY: 'Status sent successfully'
}
