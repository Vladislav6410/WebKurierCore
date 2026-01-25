# WebKurier Slack Integration (Core → PhoneCore → Security/Chain)

## 📁 Path
WebKurierCore/engine/integrations/slack/

## What it does (MVP)
- Slack message → WebKurierCore (slack-webhook.js)
- Core routes to PhoneCore for translation/chat
- Core posts response back to Slack

## Files
- slack-webhook.js — Express router: /slack/events + /slack/commands
- slack-agent.js — logic: call PhoneCore, post to Slack
- slack-config.json — config + minimal i18n (ru/en)
- README.md — this file

## Required env vars (GitHub Secrets / server env)
- SLACK_SIGNING_SECRET
- SLACK_BOT_TOKEN

Optional:
- SLACK_APP_TOKEN (later, if you add Socket Mode)

## How to mount in your Express app
In WebKurierCore server (e.g. app.js/server.js):

```js
const express = require("express");
const { makeRouter } = require("./engine/integrations/slack/slack-webhook");

const app = express();

app.use("/slack", makeRouter()); // => /slack/health, /slack/events, /slack/commands

app.listen(3000, () => console.log("Core on :3000"));