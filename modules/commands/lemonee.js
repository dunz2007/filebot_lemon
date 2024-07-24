module.exports.config = {
  name: "lemonee",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Lemonee",
  description: "Giới thiệu thông tin cá nhân của admin bot.",
  commandCategory: "Thành Viên",
  usages: "lemonee",
  cooldowns: 5,
  dependencies: {}
};

module.exports.run = async function({ api, event }) {
  const title = "[──────ADMIN ──────]"
  const name = "Dũng Nguyễn";
  const nickname = "Lemon";
  const gender = "Nam";
  const birthday = "27/01/2007";
  const city = "Bắc Ninh, Việt Nam";
  const hobbies = "Xàm lul, Đi Phượt, Chơi Game";
  const contact = {
    facebook: "https://facebook.com/1162050272",
    web: "4gsieungon.click",
    stk: "441133338888 Techcombank"
  };

  const infoMessage = `
${title}
-----------------
👤 Tên: ${name}
🎉 Biệt danh: ${nickname}
👨‍💼 Giới tính: ${gender}
🎂 Sinh nhật: ${birthday}
🏙️ Quê quán: ${city}
🎨 Sở thích: ${hobbies}
-----------------
=== CONTACT ===
📧 Facebook: ${contact.facebook}
🌐 Website: ${contact.web}
☎️ Donate: ${contact.stk}
`;

  try {
    await api.sendMessage(infoMessage, event.threadID);
  } catch (error) {
    console.error("Failed to send message:", error);
    api.sendMessage("Đã xảy ra lỗi khi gửi thông tin. Vui lòng thử lại sau.", event.threadID);
  }
};