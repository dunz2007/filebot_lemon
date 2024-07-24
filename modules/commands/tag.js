module.exports.config = {
  name: "tag",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "Bạn có thể điền thông tin của mình hoặc nhóm phát triển vào đây",
  description: "tagadmin",
  commandCategory: "Admin",
  usages: "tagadmin",
  cooldowns: 1
};

module.exports.handleEvent = function({ api, event }) {
  if (event.senderID !== "1162050272") {
    var aid = ["1162050272"];
    for (const id of aid) {
      if (Object.keys(event.mentions).includes(id)) {
        var msg = ["Dùng /callad + [nội dung] để gửi tin nhắn đến Admin!"];
        return api.sendMessage({body: msg[Math.floor(Math.random() * msg.length)]}, event.threadID, event.messageID);
      }
    }
  }
};

module.exports.run = async function({}) {
  // Code chạy khi lệnh /tag được gọi (nếu cần thiết)
};
