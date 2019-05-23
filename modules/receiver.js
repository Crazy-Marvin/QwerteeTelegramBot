const puppeteer = require('puppeteer');

module.exports = {
    globalUpdate: async () => {
        const browser = await puppeteer.launch(
            {
                // Disable sandbox at your own risk
                args: (process.env.CHROME_SANDBOX == "true" ? [] : ['--no-sandbox', '--disable-setuid-sandbox'])
            }
        );

        // Requesting Qwertee home page
        const page = await browser.newPage();
        await page.goto('https://qwertee.com', {
            timeout: 3000000
        });

        // Getting "Gone Forever" tees objects
        let goneForever = await page.evaluate(() => {
            let tees = [];
            for (let i = 0; i < document.querySelector('div.big-slides:first-child').children.length; i++) {
                const currentTee = document.querySelector('div.big-slides:first-child').children[i];
                tees.push({
                    name: currentTee.querySelector('div.title').textContent,
                    types: []
                });
                for (let j = 0; j < currentTee.querySelector('ul.icons').children.length; j++) {
                    const currentType = currentTee.querySelector('ul.icons').children[j].querySelector('a');
                    tees[i].types.push({
                        name: currentType.className.split(' ')[1],
                        img: String
                    });
                }
            }
            return tees;
        });

        // Switching between types for each tee and recording each name and image
        for (let i = 0; i < goneForever.length; i++) {
            for (let j = 0; j < goneForever[i].types.length; j++) {
                if (j > 0) {
                    await page.evaluate((i, j) => { return document.querySelector(`div.big-slides:first-child div.big-slide:nth-child(${i + 1}) ul.icons li.icon-item:nth-child(${j + 1}) a`).click() }, i, j);
                    await page.waitFor(1000);
                }
                goneForever[i].types[j].img = await page.evaluate(i => { return document.querySelector(`div.big-slides:first-child div.big-slide:nth-child(${i + 1}) img`).src }, i);
            }
        }
        // Getting "Last Chance" tees objects
        let lastChance = await page.evaluate(() => {
            let tees = [];
            for (let i = 0; i < document.querySelector('div#last-chance-desktop ul').children.length; i++) {
                const currentTee = document.querySelector('div#last-chance-desktop ul').children[i];
                tees.push({
                    name: `${currentTee.querySelector('div.info a:first-child').textContent} by ${currentTee.querySelector('div.info a:last-child').textContent}`,
                    img: currentTee.querySelector('img').src
                });
            }
            return tees;
        });

        await browser.close();

        return { goneForever, lastChance };
    }
}