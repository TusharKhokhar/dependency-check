module.exports = {
  TYPES: ['booking', 'print', 'scan', 'addvalue', 'AddValue', 'FinePayment', 'finepayment', 'other'],
  REASON_CANCELLED: ['cancelled by user', 'timed out', 'job rejected', 'other'],
  BOOK_CANCELLED_REASON: ['cancelled by staff', 'cancelled by user', 'no show', 'trade-in booking', 'other'],
  COLOR_TYPE: ['color', 'black and white', 'grayscale', 'other'],
  JOB_TYPE: ['print', 'copy', null, 'other'],
  PAYMENT_TYPE: ['credit card', 'cash', 'user account', 'mobile', 'other', 'free'],
  CREDIT_CARD_TYPE: ['visa', 'mastercard', 'discover', 'american express', 'other'],
  FINE_PAYMENT_METHOD: ['credit card', 'cash', 'user account', 'web', 'gateway', 'kiosk', 'mobile', 'other'],
  RESPONSE_STATUS: ['paid', 'error', 'other'],
  USER_TYPES: ['lms', 'internal', 'guest', 'other'],
  BOOK_CANCELLED_BY: ['self', 'staff', 'system', 'other'],
  JOB_DELIVERY_METHOD: ['file to print', 'mobile', 'web', 'staff release', 'other', 'email'],
  FORM_FINE_PAYMENT: ['kiosk', 'web', 'mobile', 'other', 'email'],
  CUSTOMER_TYPE_CHECK: 'tbs',
  UPLOAD_PATH: 'public/upload'
}
