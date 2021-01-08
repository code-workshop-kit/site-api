require('dotenv').config();
const mailgun = require('mailgun-js');

module.exports = {
  sendVerifyEmail: (opts) => {
    const { to, link, username } = opts;
    // dont ACTUALLY send verify emails when testing / developing
    if (process.env.NODE_ENV === 'production') {
      const mg = mailgun({
        apiKey: process.env.CWK_MAILGUN_KEY,
        domain: 'mail.code-workshop-kit.com',
        host: 'api.eu.mailgun.net',
      });

      const data = {
        from: 'code-workshop-kit <joren@code-workshop-kit.com>',
        to,
        subject: 'Verify your email address',
        template: 'verify-email',
        'h:X-Mailgun-Variables': JSON.stringify({
          username,
          verify_link: link,
        }),
        't:text': 'yes',
      };

      mg.messages().send(data, function (error, body) {
        console.error(error);
      });
    }
  },
  sendResetPasswordEmail: (opts) => {
    const { to, link, username } = opts;
    // dont ACTUALLY send reset password emails when testing / developing
    if (process.env.NODE_ENV === 'production') {
      const mg = mailgun({
        apiKey: process.env.CWK_MAILGUN_KEY,
        domain: 'mail.code-workshop-kit.com',
        host: 'api.eu.mailgun.net',
      });

      const data = {
        from: 'code-workshop-kit <joren@code-workshop-kit.com>',
        to,
        subject: 'Reset your password',
        template: 'reset-password',
        'h:X-Mailgun-Variables': JSON.stringify({
          username,
          reset_link: link,
        }),
        't:text': 'yes',
      };

      mg.messages().send(data, function (error, body) {
        console.error(error);
      });
    }
  },
};
