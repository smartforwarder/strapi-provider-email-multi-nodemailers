"use strict";
const nodemailer = require("nodemailer");
const aws = require("@aws-sdk/client-ses");
const transporters = {};

module.exports = {
  init: (providerOptions = {}, settings = {}) => {
    if (providerOptions.providers.ses) {
      const ses = new aws.SES({
        apiVersion: "2010-12-01",
        region: "us-east-1",
        // id and key will be read from env file
        // AWS_ACCESS_KEY_ID
        // AWS_SECRET_ACCESS_KEY
        //accessKeyId: providerOptions.key,
        //secretAccessKey: providerOptions.secret,
      });
      // create Nodemailer SES transporter
      transporters.ses = nodemailer.createTransport({
        SES: { ses, aws },
      });
    }

    // enabled scg
    if (providerOptions.providers.scg) {
      transporters.scg = nodemailer.createTransport(providerOptions.providers.scg);
    }

    transporters.default = transporters[providerOptions.defaultProvider]; 

    return {
      send: async (options) => {
        const { provider, from, to, cc, bcc, replyTo, subject, text, html, ...rest } =
          options;

        const msg = {
          from: from || settings.defaultFrom,
          to,
          cc,
          bcc,
          replyTo: replyTo || settings.defaultReplyTo,
          subject,
          text,
          html,
          ...rest,
        };

        if (provider && transporters[provider]) {
          await transporters[provider].sendMail(msg);
        } else {
          await transporters.default.sendMail(msg);
        }
      },
    };
  },
};
