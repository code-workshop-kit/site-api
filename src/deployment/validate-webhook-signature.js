const crypto = require('crypto');

module.exports.validateWebhookSignature = (payload, secret, signature) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = `sha256=${hmac.digest('hex')}`;
  return digest === signature;
};
