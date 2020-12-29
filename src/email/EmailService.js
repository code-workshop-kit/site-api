require('dotenv').config();
const sgMail = require('@sendgrid/mail');

module.exports = {
  sendVerifyEmail: (to, link) => {
    // dont ACTUALLY send verify emails when testing / developing
    if (process.env.NODE_ENV === 'production') {
      sgMail.setApiKey(process.env.CWK_SENDGRID_KEY);
      sgMail
        .send({
          to,
          from: 'joren@code-workshop-kit.com',
          templateId: 'd-576c0f6e0132446c8619ddea97061369',
          dynamicTemplateData: {
            user: 'joren',
            verify_link: link,
            Sender_Name: 'Joren Broekema',
            Sender_Address: 'Amsterdamsestraatweg 869C',
            Sender_City: 'Utrecht',
            Sender_Country: 'Netherlands',
            Sender_Zip: '3555HL',
          },
        })
        .then(
          (res) => {},
          (error) => {
            console.error(error);
            if (error.response) {
              console.error(error.response.body);
            }
          },
        );
    }
  },
};
