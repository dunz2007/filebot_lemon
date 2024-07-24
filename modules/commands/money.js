module.exports.config = {
  name: "money",
  version: "1.1.1",
  hasPermssion: 0,
  credits: "Quất",
  description: "check money",
  commandCategory: "Kiếm Tiền",
  usages: "/money",
  cooldowns: 0,
  usePrefix: false,
};

module.exports.run = async function ({ Currencies, api, event, Users }) {
  const { threadID, senderID, mentions, type, messageReply } = event;
  let targetID = senderID;
  
  if (type === 'message_reply') {
    targetID = messageReply.senderID;
  } else if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  }
  
  const name = await Users.getNameUser(targetID);
  const moment = require("moment-timezone");
  const time = moment.tz("Asia/Ho_Chi_Minh").format('HH:mm:ss || DD/MM/YYYY');

  try {
    const userData = await Currencies.getData(targetID);
    
    if (!userData || typeof userData.money === 'undefined') {
      return api.sendMessage(`- ${name} có 0$\nBây giờ là: ${time}`, threadID);
    }

    const money = userData.money;

    if (money === Infinity) {
      return api.sendMessage(`- ${name} có vô hạn tiền\nBây giờ là: ${time}`, threadID);
    }
    
    return api.sendMessage({ body: `- ${name} có ${money}$\nBây giờ là: ${time}` }, threadID);
  } catch (e) {
    console.log(e);
    return api.sendMessage("Đã có lỗi xảy ra. Vui lòng thử lại sau.", threadID);
  }
};
