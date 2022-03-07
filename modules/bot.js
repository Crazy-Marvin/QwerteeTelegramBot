const fs = require('fs');
const schedule = require('node-schedule');
const TeleBot = require('telebot');
const db = require('./db');
const MontlhyStats = require('./MonthlyStats');

const stats = new MontlyStats();

schedule.scheduleJob({hour: 0, minute: 0, dayOfWeek: 1, dayOfMonth: [1,2,3,4,5,6,7]}, () => {
  if (process.env.STATS_RECEIVER) {
    bot.sendMessage(process.env.STATS_RECEIVER, `New users: ${stats.newUsers}\nEnabled general: ${stats.enabledGeneral}\nEnabled specials: ${stats.enabledSpecials}`)
  }
  for (let key in stats) {
    stats[key] = 0
  }
  stats.lastUpdate = Date.now();
})

function initBot() {
    // Setting "bot" variable to global scope and creating new instance with token provided from the .env file
    global.bot = new TeleBot({
        token: process.env.TELEGRAM_TOKEN
    });

    // If the user is new -- adding them to our database
    bot.on('/start', (msg) => {
        db.getUser(msg.from).then(result => {
            if (result.length <= 0) {
                db.saveUser(msg.from);
                stats.newUsers += 1;
                stats.enabledGeneral += 1;
                stats.enabledSpecials += 1;
                stats.lastUpdate = Date.now();
            }
        })
        .catch(result => console.log(result));
    });

    // Menu Keyboards

    function mainMenuKeyboard() {
        let replyMarkup = bot.keyboard([
            [bot.button('Tees')],
            [bot.button('Settings')],
            [bot.button('Close')]
        ], { resize: true });
        return { replyMarkup };
    }

    async function settingsKeyboard(user) {
        let currentUser =
            await db.getUser(user).then(foundUser => {
                if (foundUser.length <= 0) {
                    tryAgain(msg.from);
                } else {
                    return foundUser[0];
                }
            }).catch(error => console.log(error));
        let replyMarkup = bot.keyboard([
            // Getting data from our database
            [bot.button(`Tee type (${currentUser.notifications.variation})`)],
            [bot.button(`${currentUser.lastChanceToggle ? 'Hide' : 'Show'} last chance tees`)],
            [bot.button('Notifications')],
            [bot.button('Main menu')]
        ], { resize: true });
        return { replyMarkup };
    }

    async function teeTypeKeyboard() {
        let teeTypes =
            await db.getTeeTypes().then(types => {
                let formattedTypes = [];
                // Creating buttons with types from our database
                for (let i = 0; i < types.length; i++) {
                    if (i % 2 == 0) {
                        formattedTypes.push([bot.button(`Select ${ types[i].name }`)]);
                    } else {
                        formattedTypes[formattedTypes.length - 1].push(bot.button(`Select ${types[i].name}`));
                    }
                }
                return formattedTypes;
            }).catch(error => console.log(error));
        teeTypes.push([bot.button('Settings')]);
        let replyMarkup = bot.keyboard(teeTypes, { resize: true });
        return { replyMarkup };
    }

    async function notificationsKeyboard(user) {
        let notificationsSettings =
            await db.getUser(user).then(foundUser => {
                if (foundUser.length <= 0) {
                    tryAgain(msg.from);
                } else {
                    return foundUser[0].notifications;
                }
            }).catch(error => console.log(error));
        // Setting up buttons according to data from our database
        let generalAction = notificationsSettings.general ? 'Disable' : 'Enable';
        let specialsAction = notificationsSettings.specials ? 'Disable' : 'Enable';
        let replyMarkup = bot.keyboard([
            [bot.button(`${generalAction} general`)],
            [bot.button(`${specialsAction} specials`)],
            [bot.button('Settings')]
        ], { resize: true });
        return { replyMarkup };
    }

    function tryAgain(user) {
        return bot.sendMessage(user.id, 'Please try again!');
    }

    function close(user) {
        return bot.sendMessage(user.id, 'Keyboard is now hidden!', { replyMarkup: 'hide' });
    }

    bot.on('/start', msg => {
        return bot.sendMessage(msg.from.id, 'Main menu', mainMenuKeyboard());
    });

    bot.on('/stats', msg => {
      return bot.sendMessage(msg.from.id, `New users: ${stats.newUsers}\nEnabled general: ${stats.enabledGeneral}\nEnabled specials: ${stats.enabledSpecials}`);
    })

    // Performing action for each menu action
    bot.on('text', async msg => {
        if (msg.text == 'Tees') {
            db.getUser(msg.from).then(foundUser => {
                if (foundUser.length <= 0) {
                    tryAgain(msg.from);
                } else {
                    sendTees(foundUser[0]);
                }
            })
                .catch(error => console.log(error));
        } else if (msg.text == 'Settings') {
            return bot.sendMessage(msg.from.id, 'Settings menu', await settingsKeyboard(msg.from));
        } else if (/(Show|Hide) last chance tees/.test(msg.text)) {
            await db.updateUser(msg.from, 'lastChanceToggle', msg.text.includes('Show'));
            return bot.sendMessage(msg.from.id, `Last chance tees ${ msg.text.includes('Show') ? 'enabled' : 'disabled' }`, await settingsKeyboard(msg.from));
        } else if (msg.text.includes('Tee type')) {
            return bot.sendMessage(msg.from.id, 'Tee type settings menu', await teeTypeKeyboard(msg.from));
        } else if (msg.text.includes('Select ')) {
            let value = msg.text.split(' ')[1];
            await db.updateUser(msg.from, 'notifications.variation', value);
            return bot.sendMessage(msg.from.id, `Tee type changed to ${ value }`, await settingsKeyboard(msg.from));
        } else if (msg.text == 'Notifications') {
            return bot.sendMessage(msg.from.id, 'Notifications settings menu', await notificationsKeyboard(msg.from));
        } else if (/(Disable|Enable) general/.test(msg.text)) {
            let enable = false;
            const [user] = await db.getUser(msg.from);
            if (!user.notifications.general) {
              enable = true;
              stats.enabledGeneral += 1;
              stats.lastUpdate = Date.now();
              db.updateUser(msg.from, 'notifications.generalEnabledAt', Date.now());
            } else {
              const enabledAt = new Date(user.notifications.generalEnabledAt);
              const now = new Date();
              if (now.getUTCFullYear() == enabledAt.getUTCFullYear()) {
                stats.enabledGeneral -= 1;
                stats.lastUpdate = Date.now();
              }
            }
            await db.updateUser(msg.from, 'notifications.general', enable);
            return bot.sendMessage(msg.from.id, `General notification (11PM) ${enable ? 'enabled' : 'disabled'}`, await notificationsKeyboard(msg.from));
        } else if (/(Disable|Enable) specials/.test(msg.text)) {
            let enable = false;
            const [user] = await db.getUser(msg.from)
            if (!user.notifications.specials) {
              enable = true;
              stats.enabledSpecials += 1;
              stats.lastUpdate = Date.now();
              db.updateUser(msg.from, 'notifications.specialsEnabledAt', Date.now());
            } else {
              const enabledAt = new Date(user.notifications.specialsEnabledAt);
              const now = new Date();
              if (now.getUTCFullYear() == enabledAt.getUTCFullYear()) {
                stats.enabledSpecials -= 1;
                stats.lastUpdate = Date.now();  
              }
            }
            await db.updateUser(msg.from, 'notifications.specials', enable);
            return bot.sendMessage(msg.from.id, `Specials notification ${enable ? 'enabled' : 'disabled'}`, await notificationsKeyboard(msg.from));
        } else if (msg.text == 'Main menu') {
            return bot.sendMessage(msg.from.id, 'Main menu', mainMenuKeyboard());
        } else if (msg.text == 'Close') {
            close(msg.from);
        }
    });

    bot.on('/stop', msg => {
        close(msg.from);
    });

    console.log('Starting bot...');
    bot.start();
}

// Sending tees to all users
function sendTees(user) {
    db.getTees()
        .then(async tees => {
            let sortedTees = {
                goneForever: [],
                lastChance: []
            };

            for (let i = 0; i < tees.length; i++) {
                if (tees[i].category == 0) {
                    for (let j = 0; j < tees[i].types.length; j++) {
                        if (tees[i].types[j].name == user.notifications.variation) {
                            sortedTees.goneForever.push({
                                name: tees[i].name,
                                img: tees[i].types[j].img
                            });
                            break;
                        }
                    }
                } else if (tees[i].category == 1) {
                    sortedTees.lastChance.push({
                        name: tees[i].name,
                        img: tees[i].types[0].img
                    })
                }
            }

            await bot.sendMessage(user.userId, 'Gone forever tees:');
            for (let i = 0; i < sortedTees.goneForever.length; i++) {
                await bot.sendPhoto(user.userId, sortedTees.goneForever[i].img, { caption: sortedTees.goneForever[i].name });
            }

            if (user.lastChanceToggle) {
                await bot.sendMessage(user.userId, 'Last chance tees:');
                for (let i = 0; i < sortedTees.lastChance.length; i++) {
                    await bot.sendPhoto(user.userId, sortedTees.lastChance[i].img, { caption: sortedTees.lastChance[i].name });
                }
            }
        })
        .catch(error => console.log(error));
}


process.on('SIGTERM', (code) => {
  exitHandler(code);
})

process.on('SIGINT', (code) => {
  exitHandler(code);
})

process.on('exit', (code) => {
  exitHandler(code);
})

function exitHandler(code) {
  fs.writeFileSync('./stats.json', JSON.stringify(stats));
  process.exit(code);
}

module.exports = {
    sendTees,
    initBot
}