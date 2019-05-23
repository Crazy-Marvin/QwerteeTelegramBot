require('dotenv').config()

const bot = require('./modules/bot');
const scheduler = require('./modules/scheduler');

(function run() {
    scheduler.startGlobalUpdate();
    bot.initBot();
})();