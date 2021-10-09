__Assuming you are on a fresh Ubuntu VPS:__

### Install MongoDB, Node.js & Chromium
sudo apt install -y mongodb nodejs chromium-browser

### Create a MongoDB
You may create it at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)  
or [set it up locally](https://docs.mongodb.com/manual/administration/install-on-linux/)

### Clone the bot
git clone https://github.com/Crazy-Marvin/QwerteeTelegramBot.git

### Create a .env file

Please put your credentials into the .env file

mv .env.example .env

```TELEGRAM_TOKEN``` is the token you get from [@BotFather](https://t.me/BotFather) directly in [Telegram](https://telegram.org/).  

```DB_URI``` is the MongoDB connection string.  
You can get the connection string with this command: ```mongo --eval 'db.runCommand({ connectionStatus: 1 })'```

```HEALTH_CHECK_URL``` is your personal URL from your [healthchecks.io](https://healthchecks.io/) dashboard.

You can keep the others entries as they are.

### Install the bot

node app  
npm install  
nano /lib/systemd/system/qwerteebot.service  
systemctl start qwerteebot  
systemctl enable qwerteebot  
watch systemctl status qwerteebot  

### Enjoy

Your bot is running now and automatically restarts after a server reboot. 
