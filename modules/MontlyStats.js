const fs = require('fs');

class MontlyStats {
  constructor() {
    this.newUsers = 0;
    this.enabledGeneral = 0;
    this.enabledSpecials = 0;
    this.lastUpdate = 0;

    const fileContent = fs.readFileSync("./stats.json", "utf-8");
    if (fileContent) {
      const obj = JSON.parse(fileContent);
      this.newUsers = obj.newUsers;
      this.enabledGeneral = obj.enabledGeneral;
      this.enabledSpecials = obj.enabledSpecials;
      this.lastUpdate = obj.lastUpdate;
    }
  }
}

module.exports = MontlyStats;