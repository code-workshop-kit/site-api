require('dotenv').config();
const FormData = require('form-data');
const fetch = require('node-fetch');
const btoa = require('btoa');

const domain = 'mail.code-workshop-kit.com';
const api = 'api.eu.mailgun.net/v3';

async function handleResponse(response) {
  let result;
  try {
    result = await response.json();
  } catch (err) {
    //
  }

  if (!response.ok) {
    if (result.message) {
      console.error(`Mailgun Error: ${result.message}`);
    } else if (result.error) {
      console.error(`Mailgun Error: ${result.error}`);
    }
  }
}

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

  const formData = new FormData();
  Object.entries(data).forEach((entry) => {
    formData.append(entry[0], `${entry[1]}`);
  });

  const response = await fetch(`https://${api}/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`api:${process.env.MAILGUN_KEY}`)}`,
    },
    body: formData,
  });

  await handleResponse(response);
}

module.exports = {
  addToMailingList: async (opts, list) => {
    const formData = new FormData();
    formData.append('address', opts.address);

    const response = await fetch(`https://${api}/lists/${list}/members`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`api:${process.env.MAILGUN_KEY}`)}`,
      },
      body: formData,
    });

    await handleResponse(response);
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
