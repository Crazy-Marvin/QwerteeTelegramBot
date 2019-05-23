const schedule = require('node-schedule');

const receiver = require('./receiver');
const botModule = require('./bot');
const db = require('./db');

// Updating data every hour but not sending it
schedule.scheduleJob('2 * * * *', startGlobalUpdate);
// Global update at 11 PM
schedule.scheduleJob('1 23 * * *', startGlobalSend);

// Scraping tees from the website
function startGlobalUpdate(force = false) {
    function init() {
        console.log('Starting update...')
        receiver.globalUpdate()
            .then((result) => {
                global.globalUpdating = true;
                db.clearTeesData()
                    .then(async () => {
                        for (let i = 0; i < result.goneForever.length; i++) {
                            await db.saveTee(result.goneForever[i], 0);
                        }
                        for (let i = 0; i < result.goneForever[0].types.length; i++) {
                            await db.saveTeeType(result.goneForever[0].types[i].name);
                        }
                        for (let i = 0; i < result.lastChance.length; i++) {
                            const tee = result.lastChance[i];
                            const formattedTee = {
                                name: tee.name,
                                types: [
                                    {
                                        name: 'main',
                                        img: tee.img
                                    }
                                ]
                            }
                            await db.saveTee(formattedTee, 1);
                        }
                        global.globalUpdating = false;
                        await db.updateSaveDate();
                    });
            })
            .catch((error) => console.log(error));
    };

    // Saving "Last Updated" value to our database
    db.Option.findOne({ name: 'Last Update' }, function(error, option) {
        if (option && !force && !(typeof globalUpdating !== 'undefined' && !globalUpdating)) {
            const oneHour = 60 * 60 * 1000;
            if (((new Date) - option.data) >= oneHour) {
                console.log('Outdated!');
                init();
            } else {
                console.log('Already updated!');
            }
        } else {
            init();
        }
    });
}

// Sending tees to every user
function startGlobalSend() {
    function init() {
        console.log('Starting global tees send...')
        db.getUsers()
            .then(users => {
                for (let i = 0; i < users.length; i++) {
                    // If user has enabled notifications
                    if (users[i].notifications.general) {
                        botModule.sendTees(users[i]);
                    }
                }
            })
            .catch(error => console.log(error));
    }

    startGlobalUpdate(true);
    // Waiting to be sure that data is updated
    setTimeout(init, 120000);
}

module.exports = { startGlobalUpdate };