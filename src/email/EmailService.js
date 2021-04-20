require('dotenv').config();
const mailgun = require('mailgun-js');

const mg = mailgun({
  apiKey: process.env.MAILGUN_KEY,
  domain: 'mail.code-workshop-kit.com',
  host: 'api.eu.mailgun.net',
});

async function sendEmail(opts) {
  const { to, mailgunVars = JSON.stringify({}), subject, template } = opts;

  const data = {
    from: 'code-workshop-kit <joren@code-workshop-kit.com>',
    to,
    subject,
    template,
    'h:X-Mailgun-Variables': mailgunVars,
    't:text': 'yes',
  };

  // dont ACTUALLY send verify emails when testing / developing
  if (process.env.NODE_ENV !== 'production') {
    data['o:testmode'] = true;
  }

  mg.messages().send(data, (error) => {
    if (error) {
      console.error(error);
    }
  });
}

module.exports = {
  addToMailingList: async (opts, list) => {
    const mailingList = mg.lists(list);
    mailingList.members().create(opts, (err) => {
      if (err) {
        console.error(err);
      }
    });
  },
  sendNewsletterEmail: async (opts) => {
    await sendEmail({
      ...opts,
      to: 'announcements@mail.code-workshop-kit.com',
    });
  },
  sendVerifyEmail: async (opts) => {
    const { link, username } = opts;
    await sendEmail({
      ...opts,
      subject: 'Verify your email address',
      template: 'verify-email',
      mailgunVars: JSON.stringify({
        username,
        verify_link: link,
      }),
    });
  },
  sendResetPasswordEmail: async (opts) => {
    const { link, username } = opts;
    await sendEmail({
      ...opts,
      subject: 'Reset your password',
      template: 'reset-password',
      mailgunVars: JSON.stringify({
        username,
        reset_link: link,
      }),
    });
  },
};
