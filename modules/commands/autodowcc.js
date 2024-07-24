module.exports.config = {
  name: "autodowcc",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Vtuan",
  description: "autodown capcut",
  commandCategory: "Tiện ích",
  usages: "",
  cooldowns: 5
};
const axios = require('axios');
const fs = require('fs');
const linkapi = "https://api.sumiproject.net/capcutdowload?url=";
const isCapCutVideoLink = url => /^(https?:\/\/(www\.)?capcut\.(net|com)\/(t|watch)\/[a-zA-Z0-9]+\/?).*/.test(url);
exports.handleEvent = async function({ api, event }) {
      const str = event.body;
      const send = msg => api.sendMessage(msg, event.threadID, event.messageID);
      const links = str.match(/(https?:\/\/[^\s]+)/g) || [];
      for (const link of links) {
          if (isCapCutVideoLink(link)) {
              const res = await axios.get(`${linkapi}${link}`);
              const videoData = res.data;
              const stream = (await axios.get(videoData.video, { responseType: "arraybuffer" })).data;
              const path = __dirname + '/cache/vdcc.mp4';
              fs.writeFileSync(path, Buffer.from(stream, "utf-8"));
              send({body:`[ AUTODOWN CAPCUT ]\n\n📝 Title: ${videoData.title}\n✏️ Mô tả: ${videoData.description}\n📥 Lượt dùng: ${videoData.usage}\n──────────────────\n
📺 Đây là tính năng tự động tải khi phát hiện link.`, attachment: fs.createReadStream(path) });
          }
      }
};
module.exports.run = async function ({ api }) {};