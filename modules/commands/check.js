module.exports.config = {
  name: "check",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "DungUwU && Nghĩa",
  description: "Check tương tác ngày/tuần/toàn bộ",
  commandCategory: "Quản Trị Viên",
  usages: "[me/all/week/day]",
  cooldowns: 5,
  dependencies: {
    "fs": " ",
    "moment-timezone": " "
  }
};

const path = __dirname + '/kiemtra/';
const moment = require('moment-timezone');

module.exports.onLoad = () => {
  const fs = require('fs');
  if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
    fs.mkdirSync(path, { recursive: true });
  }
  setInterval(() => {
    const today = moment.tz("Asia/Ho_Chi_Minh").day();
    const checkttData = fs.readdirSync(path);
    checkttData.forEach(file => {
      try { var fileData = JSON.parse(fs.readFileSync(path + file)) } catch { return fs.unlinkSync(path + file) };
      if (fileData.time != today) {
        setTimeout(() => {
          fileData = JSON.parse(fs.readFileSync(path + file));
          if (fileData.time != today) {
            fileData.time = today;
            fs.writeFileSync(path + file, JSON.stringify(fileData, null, 4));
          }
        }, 60 * 1000);
      }
    })
  }, 60 * 1000);
}

module.exports.handleEvent = async function({ api, event, Threads }) {
  try {
    if (!event.isGroup) return;
    if (global.client.sending_top == true) return;
    const fs = global.nodemodule['fs'];
    const { threadID, senderID } = event;
    const today = moment.tz("Asia/Ho_Chi_Minh").day();

    if (!fs.existsSync(path + threadID + '.json')) {
      var newObj = {
        total: [],
        week: [],
        day: [],
        time: today,
        last: {
          time: today,
          day: [],
          week: [],
        },
      };
      fs.writeFileSync(path + threadID + '.json', JSON.stringify(newObj, null, 4));
    } else {
      var newObj = JSON.parse(fs.readFileSync(path + threadID + '.json'));
    }

    if (true) {
      const UserIDs = event.participantIDs || [];
      if (UserIDs.length != 0) for (let user of UserIDs) {
        if (!newObj.last) newObj.last = {
          time: today,
          day: [],
          week: [],
        };
        if (!newObj.last.week.find(item => item.id == user)) {
          newObj.last.week.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.last.day.find(item => item.id == user)) {
          newObj.last.day.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.total.find(item => item.id == user)) {
          newObj.total.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.week.find(item => item.id == user)) {
          newObj.week.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.day.find(item => item.id == user)) {
          newObj.day.push({
            id: user,
            count: 0
          });
        }
      }
    };
    fs.writeFileSync(path + threadID + '.json', JSON.stringify(newObj, null, 4));

    const threadData = JSON.parse(fs.readFileSync(path + threadID + '.json'));
    if (threadData.time != today) {
      global.client.sending_top = true;
      setTimeout(() => global.client.sending_top = false, 5 * 60 * 1000);
    }
    const userData_week_index = threadData.week.findIndex(e => e.id == senderID);
    const userData_day_index = threadData.day.findIndex(e => e.id == senderID);
    const userData_total_index = threadData.total.findIndex(e => e.id == senderID);
    if (userData_total_index == -1) {
      threadData.total.push({
        id: senderID,
        count: 1,
      });
    } else threadData.total[userData_total_index].count++;
    if (userData_week_index == -1) {
      threadData.week.push({
        id: senderID,
        count: 1
      });
    } else threadData.week[userData_week_index].count++;
    if (userData_day_index == -1) {
      threadData.day.push({
        id: senderID,
        count: 1
      });
    } else threadData.day[userData_day_index].count++;
    let p = event.participantIDs;
    if (!!p && p.length > 0) {
      p = p.map($ => $ + '');
      ['day', 'week', 'total'].forEach(t => threadData[t] = threadData[t].filter($ => p.includes($.id + '')));
    };
    fs.writeFileSync(path + threadID + '.json', JSON.stringify(threadData, null, 4));
  } catch (e) { };
}

module.exports.run = async function({ api, event, args, Users, Threads }) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const fs = global.nodemodule['fs'];
  const { threadID, messageID, senderID } = event;
  let path_data = path + threadID + '.json';
  if (!fs.existsSync(path_data)) {
    return api.sendMessage("Chưa có dữ liệu", threadID);
  }
  const threadData = JSON.parse(fs.readFileSync(path_data));
  const query = args[0] ? args[0].toLowerCase() : '';

  if (!query) {
    return api.sendMessage("[ Check Tương Tác ]\n──────────────────\n- Dùng: ${prefix}${this.config.name} me để xem tương tác của bạn\n- Dùng: ${prefix}${this.config.name} day/week/all để xem tương tác ngày/tuần/tháng của các thành viên trong nhóm.", threadID);
  } else if (query == 'me') {
    const me_total = threadData.total.find(e => e.id == senderID)?.count || 0;
    const me_week = threadData.week.find(e => e.id == senderID)?.count || 0;
    const me_day = threadData.day.find(e => e.id == senderID)?.count || 0;
    const name = global.data.userName.get(senderID) || await Users.getNameUser(senderID);
    const rank_total = threadData.total.sort((a, b) => b.count - a.count).findIndex(e => e.id == senderID) + 1;
    const msg = `👤 Tên: ${name}\n─────────────────\n💬 Tin Nhắn Trong Ngày: ${me_day}\n💬 Tin Nhắn Trong Tuần: ${me_week}\n💬 Tổng Tin Nhắn: ${me_total}\n─────────────────\n🏆 Hạng Tổng: ${rank_total}`;
    return api.sendMessage(msg, threadID, messageID);
  } else if (query == 'all') {
    let header = '[ Tất Cả Tin Nhắn ]\n─────────────────';
    let data = threadData.total.sort((a, b) => b.count - a.count);
    let body = '';
    for (const [index, dataU] of data.entries()) {
      const userName = global.data.userName.get(dataU.id) || await Users.getNameUser(dataU.id);
      const item = dataU.count;
      body += `${index + 1}. ${userName} : ${item} tin nhắn\n`;
    }
    let footer = '─────────────────';
    return api.sendMessage(header + '\n' + body + '\n' + footer, threadID, messageID);
  } else if (query == 'week') {
    let header = '[ Tin Nhắn Trong Tuần ]\n─────────────────';
    let data = threadData.week.sort((a, b) => b.count - a.count);
    let body = '';
    for (const [index, dataU] of data.entries()) {
      const userName = global.data.userName.get(dataU.id) || await Users.getNameUser(dataU.id);
      const item = dataU.count;
      body += `${index + 1}. ${userName} : ${item} tin nhắn\n`;
    }
    let footer = '─────────────────';
    return api.sendMessage(header + '\n' + body + '\n' + footer, threadID, messageID);
  } else if (query == 'day') {
    let header = '[ Tin Nhắn Trong Ngày ]\n─────────────────';
    let data = threadData.day.sort((a, b) => b.count - a.count);
    let body = '';
    for (const [index, dataU] of data.entries()) {
      const userName = global.data.userName.get(dataU.id) || await Users.getNameUser(dataU.id);
      const item = dataU.count;
      body += `${index + 1}. ${userName} : ${item} tin nhắn\n`;
    }
    let footer = '─────────────────';
    return api.sendMessage(header + '\n' + body + '\n' + footer, threadID, messageID);
  } else {
    return api.sendMessage("[ Check Tương Tác ]\n──────────────────\n- Dùng: ${prefix}${this.config.name} me để xem tương tác của bạn\n- Dùng: ${prefix}${this.config.name} day/week/all để xem tương tác ngày/tuần/tháng của các thành viên trong nhóm.", threadID);
  }
};
