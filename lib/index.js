"use strict";
const nodemailer = require("nodemailer");
const aws = require("@aws-sdk/client-ses");
const transporters = {};

module.exports = {
  init: (providerOptions = {}, settings = {}) => {
    Object.keys(providerOptions.providers).forEach((provider) => {
      if (provider === "ses") {
        const ses = new aws.SES({
          apiVersion: "2010-12-01",
          region: "us-east-1",
        });
        // create Nodemailer SES transporter
        transporters.ses = nodemailer.createTransport({
          SES: { ses, aws },
        });
      } else {
        transporters[provider] = nodemailer.createTransport(
          providerOptions.providers[provider]
        );
      }
    });

    transporters.default = transporters[providerOptions.defaultProvider];

    return {
      send: async (options) => {
        const {
          provider,
          from,
          to,
          cc,
          bcc,
          replyTo,
          subject,
          text,
          html,
          mailConfig,
          ...rest
        } = options;

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

        let result;
        if (provider && mailConfig) {
          const config = Object.assign(providerOptions.providers[provider],mailConfig)
          const transporter = nodemailer.createTransport(config);
          // 发送电子邮件
          result = await transporter.sendMail(msg);
        }else if (provider && transporters[provider]) {
          result = await transporters[provider].sendMail(msg);
        } else {
          result = await transporters.default.sendMail(msg);
        }
        return result;
      },
    };
  },
};
