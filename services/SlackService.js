"use strict";

var rp = require('request-promise');

const slackLogFlag = process.env.LOG_TO_SLACK || true;
const slackChannels = {
  //alertasvh: 'https://hooks.slack.com/services/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'
  alertasvh: 'https://hooks.slack.com/services/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'
};

async function log(level, msg, type, callback) {
  console.log("SlackService.log() -> " + type + " - " + level + " - " + msg);
  if (slackLogFlag === false) {
    return;
  }
  let payload = {
    username: type + " Bot",
    text: msg,
    mrkdwn: true,
  };

  var RequestOpts = {
    uri: slackChannels.alertasvh,
    method: 'POST',
    body: payload,
    json: true
  };

  logThis(['Slack: Sending message', level, stringifyThis(RequestOpts), stringifyThis(msg)]);

  rp(RequestOpts)
    .then((response) => {
      logThis(['Slack: Response', level, stringifyThis(response)]);
    })
    .catch((err) => {
      logThis(['Slack: Error', stringifyThis(err)]);
    });
};

function logThis(anything) {
  console.log('+------------------------------------------------------------+');
  console.log(anything);
  console.log('+------------------------------------------------------------+');
}

function stringifyThis(plainJson) {
  return JSON.stringify(plainJson);
}

module.exports = {
  log: log
}