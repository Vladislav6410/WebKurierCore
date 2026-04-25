# WebKurier Handyman Deployment

## Repository Roles

- WebKurierCore: CRM, HandymanAgent, Telegram bot, API, dispatch logic.
- WebKurierSite: public landing page and lead capture.
- WebKurierHybrid: deployment map and infrastructure notes.
- WebKurierSecurity: later security scanning and audit.
- WebKurierChain: later payments, logs and financial ledger.

## Local Run

```bash
cd WebKurierCore
npm install
export HANDYMAN_ADMIN_TOKEN="change_this_admin_token"
export HANDYMAN_TELEGRAM_TOKEN="telegram_token"
npm start