"use strict";

var rp = require('request-promise');

const slackLogFlag = process.env.LOG_TO_SLACK || true;
const slackChannels = {
    alertasvh: 'https://hooks.slack.com/services/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'
};

async function log(level, msg, callback) {
    if (slackLogFlag === false) {
        return;
    }
    let payload = {
        username: "Pagos Bot",
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
    log:log
}