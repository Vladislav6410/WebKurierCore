#!/bin/bash
cd /srv/webkurier-data/repos/WebKurier/WebKurierCore || exit 1
echo "WebKurierCore Production Start"
node -v
npm install
node server.js
