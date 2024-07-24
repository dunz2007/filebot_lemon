const fs = require('fs');
const axios = require('axios');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Ho_Chi_Minh'); // Đặt múi giờ theo múi giờ Việt Nam

module.exports.config = {
    name: "lode",    
    version: "1.0.0", 
    hasPermssion: 0,
    credits: "vh",
    description: "bv", 
    commandCategory: "Trò Chơi",
    usages: "sf",
    cooldowns: 0
};

const moneyFilePath = 'cache/money.json';
const betsFilePath = 'cache/bets.json';
const apiUrl = 'https://api-xsmb-today.onrender.com/api/v1';

function isBettingAllowed() {
    const now = moment();
    const startBetTime = moment().set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
    const endBetTime = moment().set({ hour: 18, minute: 35, second: 0, millisecond: 0 });

    return now.isBetween(startBetTime, endBetTime);
}
function ensureFilesExist() {
    if (!fs.existsSync(moneyFilePath)) {
        fs.writeFileSync(moneyFilePath, JSON.stringify({}, null, 4));
    }
    if (!fs.existsSync(betsFilePath)) {
        fs.writeFileSync(betsFilePath, JSON.stringify({}, null, 4));
    }
}

function updateBalance(userId, amount) {
    let data = JSON.parse(fs.readFileSync(moneyFilePath, 'utf8'));
    if (!data[userId]) data[userId] = 0;
    data[userId] += amount;
    fs.writeFileSync(moneyFilePath, JSON.stringify(data, null, 4));
}

function setBalance(userId, amount) {
    let data = JSON.parse(fs.readFileSync(moneyFilePath, 'utf8'));
    data[userId] = amount;
    fs.writeFileSync(moneyFilePath, JSON.stringify(data, null, 4));
}

function getBalance(userId) {
    let data = JSON.parse(fs.readFileSync(moneyFilePath, 'utf8'));
    return data[userId] || 0;
}

function addBet(userId, gameType, betNumber, betAmount) {
    let bets = JSON.parse(fs.readFileSync(betsFilePath, 'utf8'));
    if (!bets[userId]) bets[userId] = [];
    bets[userId].push({ gameType, betNumber, betAmount });
    fs.writeFileSync(betsFilePath, JSON.stringify(bets, null, 4));
}

function getBets() {
    return JSON.parse(fs.readFileSync(betsFilePath, 'utf8'));
}

function resetBets() {
    fs.writeFileSync(betsFilePath, JSON.stringify({}, null, 4));
}

async function fetchResults() {
    try {
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error('Error fetching lottery results:', error);
        return null;
    }
}

function checkResults(results, bets) {
    let winners = [];
    let losers = [];

    for (let userId in bets) {
        let userBets = bets[userId];
        for (let bet of userBets) {
            let { gameType, betNumber, betAmount } = bet;
            let isWinner = false;
            let multiplier = 0;

            // Implement the logic to check if the betNumber is a winner based on the results
            switch (gameType) {
                case "Lô Xiên":
                    isWinner = results.G1.includes(betNumber) && results.G2.includes(betNumber);
                    multiplier = 17;
                    break;
                case "Bao Lô":
                    isWinner = results.G1.includes(betNumber);
                    multiplier = 99;
                    break;
                case "Đầu đuôi":
                    isWinner = results.G1.some(result => result.startsWith(betNumber)) || results.G1.some(result => result.endsWith(betNumber));
                    multiplier = 9.5;
                    break;
                case "Đề":
                    isWinner = results.ĐB.includes(betNumber);
                    multiplier = 95;
                    break;
                case "3 càng":
                    isWinner = results.G1.includes(betNumber);
                    multiplier = 900;
                    break;
                default:
                    isWinner = false;
            }

            if (isWinner) {
                winners.push({ userId, betNumber, betAmount, multiplier });
            } else {
                losers.push({ userId, betNumber, betAmount });
            }
        }
    }

    return { winners, losers };
}

async function announceResults(api, threadID) {
    const now = moment();
    const results = await fetchResults();
    if (!results) return;

    const bets = getBets();
    const { winners, losers } = checkResults(results, bets);

    let resultMessage = "Kết quả:\n────────────────────\n";
    
    // Thêm thông tin người chơi thắng
    resultMessage += "✅ Người chơi thắng:\n";
    winners.forEach(w => {
        const winnings = w.betAmount * w.multiplier;
        resultMessage += `ID: ${w.userId}, Số: ${w.betNumber}, Tiền: ${w.betAmount}, Tiền thắng: ${winnings}\n`;
        updateBalance(w.userId, winnings);
    });

    // Thêm thông tin người chơi thua
    resultMessage += "\n❎ Người chơi thua:\n";
    losers.forEach(l => {
        resultMessage += `ID: ${l.userId}, Số: ${l.betNumber}, Tiền: ${l.betAmount}\n`;
    });

    api.sendMessage(resultMessage, threadID);

    resetBets();
}

// Hàm để kiểm tra và thông báo kết quả hàng ngày lúc 18:31
function scheduleResultsAnnouncement(api) {
    const now = moment();
    const nextAnnouncement = moment().set({ hour: 18, minute: 31, second: 0, millisecond: 0 }).add(1, 'day');

    if (now.isAfter(nextAnnouncement)) {
        nextAnnouncement.add(1, 'day');
    }

    const timeout = nextAnnouncement.diff(now);
    setTimeout(() => {
        announceResults(api, threadID);
        scheduleResultsAnnouncement(api);
    }, timeout);
}

// Khởi tạo lịch trình thông báo kết quả
scheduleResultsAnnouncement(api);

module.exports.run = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    const args = body.slice(this.config.name.length + 1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    ensureFilesExist();

    if (command === "money") {
        if (args[0] === "+" && !isNaN(args[1])) {
            updateBalance(senderID, parseInt(args[1]));
            api.sendMessage(`✅ Đã cộng ${args[1]} vào tài khoản của bạn.`, threadID);
        } else if (args[0] === "-" && !isNaN(args[1])) {
            updateBalance(senderID, -parseInt(args[1]));
            api.sendMessage(`✅ Đã trừ ${args[1]} khỏi tài khoản của bạn.`, threadID);
        } else if (args[0] === "reset") {
            setBalance(senderID, 0);
            api.sendMessage("✅ Số dư của bạn đã được reset về 0.", threadID);
        } else {
            api.sendMessage("❎ Lệnh không hợp lệ. Sử dụng: /lode money + [số tiền], /lode money - [số tiền], hoặc /lode money reset.", threadID);
        }
    } else {
        const now = moment();
        if (!isBettingAllowed()) {
            api.sendMessage("❎ Hiện tại không thể đặt cược. Vui lòng quay lại sau 18:35.", threadID);
            return;
        }

        api.sendMessage(
            "[Danh Sách Trò Chơi]\n────────────────────\n" +
            "1. Trò Chơi\n" +
            "2. Set Tiền\n" +
            "3. Kiểm Tra Số Dư\n" +
            "4. Cách Chơi\n" +
            "\nVui lòng chọn bằng cách Reply tin nhắn này từ 1 đến 4.", 
            threadID,
            (err, info) => {
                if (err) return console.error(err);
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    type: "mainMenu"
                });
            }
        );
    }
};


module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { type } = handleReply;
    const { threadID, senderID, body } = event;
    const userChoice = parseInt(body.trim());
    api.unsendMessage(handleReply.messageID);
    if (type === "mainMenu") {
        if (userChoice === 1) {
            api.sendMessage(
                "[Danh Sách Trò Chơi]\n────────────────────\n" +
                "1. Lô Xiên\n" +
                "2. Bao Lô\n" +
                "3. Đầu đuôi\n" +
                "4. Đề\n" +
                "5. 3 càng\n" +
                "\nVui lòng chọn một trò chơi bằng cách Reply tin nhắn này từ 1 đến 5.",
                threadID,
                (err, info) => {
                    if (err) return console.error(err);
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        type: "selectGame"
                    });
                }
            );
        } else if (userChoice === 2) {
            api.sendMessage(
                "[Danh Sách Set Tiền]\n────────────────────\n" +
                "1. Nhập /lode money + [số tiền] để cộng thêm tiền\n" +
                "2. Nhập /lode money - [số tiền] để trừ tiền\n" +
                "3. Nhập /lode money reset để reset tiền",
                threadID
            );
        } else if (userChoice === 3) {
            const balance = getBalance(senderID);
            api.sendMessage(`Số dư của bạn hiện tại là: ${balance}`, threadID);
        } else if (userChoice === 4) {
            api.sendMessage(
                "Cách Chơi\n────────────────────\n" +
                "Xiên 2:\n- Xiên 2 của 2 chữ số cuối trong lô 27 giải. - Thắng gấp 17 lần.\n" +
                "Ví dụ : đánh 1000 cho xiên 11-13, Tổng thanh toán: 1000. Nếu trong lô có 2 chữ số cuối là 11, 13 thì Tiền thắng: 1000 x 17 = 17000.\n\n" +
                "Xiên 3:\n- Xiên 3 của 2 chữ số cuối trong lô 27 giải. Thắng gấp 65 lần.\n" +
                "Ví dụ : đánh 1000 cho xiên 11-13-15, Tổng thanh toán: 1000. Nếu trong lô có 2 chữ số cuối là 11,13,15 thì Tiền thắng: 1000 x 65 = 65000.\n\n" +
                "Xiên 4:\n- Xiên 4 của 2 chữ số cuối trong lô 27 giải. - Thắng gấp 250 lần.\n" +
                "Ví dụ : đánh 1000 cho xiên 11-13-15-20, Tổng thanh toán: 1000. Nếu trong lô có 2 chữ số cuối là 11,13,15,20 thì Tiền thắng: 1000 x 250 = 250000.\n\n" +
                "Lô 2 số:\n- Đánh 2 chữ số cuối trong lô 27 giải. - Thắng gấp 99 lần, nếu số đó về N lần thì tính kết quả x N lần.\n" +
                "Ví dụ: đánh lô 79 - 1 con 1000, Tổng thanh toán: 1000 x 27 = 27000. Nếu trong lô có 2 chữ số cuối là 79 thì Tiền thắng: 1000 x 99 = 99000, nếu có N lần 2 chữ số cuối là 79 thì Tiền thắng là: 1000 x 99 x N.\n\n" +
                "Lô 3 số:\n- Đánh 3 chữ số cuối trong lô 23 giải. - Thắng gấp 900 lần, nếu số đó về N lần thì tính kết quả x N lần.\n" +
                "Ví dụ: đánh lô 789 - 1 con 1000, Tổng thanh toán: 1000 x 23 = 23000. Nếu trong lô có 3 chữ số cuối là 789 thì Tiền thắng: 1000 x 900 = 900000, nếu có N lần 3 chữ số cuối là 789 thì Tiền thắng là: 1000 x 900 x N.\n\n" +
                "Đầu :\n- Đánh 1 chữ số ở hàng chục của giải ĐB. - Thắng gấp 9.5 lần.\n" +
                "Ví dụ: đánh 1000 cho số 7. Tổng thanh toán: 1000. Nếu giải ĐB là xxx7x thì Tiền thắng: 1000 x 9.5 = 95000.\n\n" +
                "Đuôi :\n- Đánh 1 chữ số cuối của giải ĐB. - Thắng gấp 9.5 lần.\n" +
                "Ví dụ: đánh 1000 cho số 7. Tổng thanh toán: 1000. Nếu giải ĐB là xxxx7 thì Tiền thắng: 1000 x 9.5 = 95000.\n\n" +
                "Đề đặc biệt:\n- Đánh 2 chữ số cuối trong giải ĐB. - Thắng gấp 95 lần.\n" +
                "Ví dụ: đánh 1000 cho số 79. Tổng thanh toán: 1000. Nếu giải ĐB là xxx79 thì Tiền thắng: 1000 x 95 = 95000.\n\n" +
                "Đề đầu :\n- Đánh lô giải 7 ( có 4 giải, thanh toán đủ ). - Thắng gấp 95 lần.\n" +
                "Ví dụ: đánh 1000 cho số 79, Tổng thanh toán: 1000 x 4 = 4000. Nếu trong lô giải 7 có 1 số 79 thì Tiền thắng: 1000 x 95 = 95000.\n\n" +
                "3 càng:\n- Đánh 3 chữ số cuối của giải ĐB. - Thắng gấp 900 lần.\n" +
                "Ví dụ: đánh 1000 cho số 879, Tổng thanh toán: 1000. Nếu giải ĐB là xx879 thì Tiền thắng: 1000 x 900 = 900000.", 
                threadID
            );
        } else {
            api.sendMessage("❎ Lựa chọn không hợp lệ. Vui lòng thử lại.", threadID);
        }
    } else if (type === "selectGame") {
        let gameType;
        switch (userChoice) {
            case 1: gameType = "Lô Xiên"; break;
            case 2: gameType = "Bao Lô"; break;
            case 3: gameType = "Đầu đuôi"; break;
            case 4: gameType = "Đề"; break;
            case 5: gameType = "3 càng"; break;
            default: return api.sendMessage("❎ Lựa chọn không hợp lệ. Vui lòng thử lại.", threadID);
        }

        api.sendMessage(
            `✅ Bạn đã chọn trò chơi ${gameType}.\n` +
            "Vui lòng nhập số bạn muốn cược.",
            threadID,
            (err, info) => {
                if (err) return console.error(err);
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    type: "betNumber",
                    gameType
                });
            }
        );
    } else if (type === "betNumber") {
        const betNumber = body.trim();
        const { gameType } = handleReply;

        // Kiểm tra định dạng đầu vào theo loại trò chơi
        if ((gameType === "Lô Xiên" || gameType === "Bao Lô" || gameType === "Đề") && (!/^\d{2}$/.test(betNumber) || parseInt(betNumber) > 99)) {
            return api.sendMessage("❎ Số không hợp lệ. Vui lòng nhập 2 chữ số từ 00 đến 99.", threadID);
        }
        if (gameType === "Đầu đuôi" && (!/^\d{1}$/.test(betNumber) || parseInt(betNumber) > 9)) {
            return api.sendMessage("❎ Số không hợp lệ. Vui lòng nhập 1 chữ số từ 0 đến 9.", threadID);
        }
        if (gameType === "3 càng" && (!/^\d{3}$/.test(betNumber) || parseInt(betNumber) > 999)) {
            return api.sendMessage("❎ Số không hợp lệ. Vui lòng nhập 3 chữ số từ 000 đến 999.", threadID);
        }

        api.sendMessage(
            `✅ Bạn đã chọn số ${betNumber} cho trò chơi ${gameType}.\n` +
            "Vui lòng nhập số tiền bạn muốn cược (tối thiểu 1000).",
            threadID,
            (err, info) => {
                if (err) return console.error(err);
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    type: "betAmount",
                    gameType,
                    betNumber
                });
            }
        );
    } else if (type === "betAmount") {
        const betAmount = parseInt(body.trim());
        const { gameType, betNumber } = handleReply;

        if (isNaN(betAmount) || betAmount < 1000) {
            return api.sendMessage("❎ Số tiền cược không hợp lệ. Vui lòng nhập số tiền lớn hơn hoặc bằng 1000.", threadID);
        }

        const currentBalance = getBalance(senderID);
        if (currentBalance < betAmount) {
            return api.sendMessage("❎ Số dư không đủ để thực hiện cược. Vui lòng nạp thêm tiền.", threadID);
        }

        updateBalance(senderID, -betAmount);
        addBet(senderID, gameType, betNumber, betAmount);

        api.sendMessage(
            `✅ Bạn đã đặt cược ${betAmount} vào số ${betNumber} cho trò chơi ${gameType}.\n` +
            `Số dư hiện tại của bạn là: ${currentBalance - betAmount}.`,
            threadID
        );
    }
};

module.exports.announceResults = announceResults;