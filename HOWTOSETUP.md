# .ENV FILE
1) TELEGRAM_TOKEN it is a token a telegram bot that can be create with @BotFather in telegram <br />
2) DB_URI it is a connection string of mongodb
You need to create it at https://www.mongodb.com/cloud/atlas or download mongodb server and setup it locally [Windows](https://medium.com/@LondonAppBrewery/how-to-download-install-mongodb-on-windows-4ee4b3493514), [Linux](https://docs.mongodb.com/manual/administration/install-on-linux/).
You can get connection string with this command: mongo --eval 'db.runCommand({ connectionStatus: 1 })'