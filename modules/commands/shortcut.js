const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "shortcut",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Lemon",
    description: "Phiên bản xịn hơn của short",
    commandCategory: "Thành Viên",
    usages: "[all/delete/empty]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

module.exports.onLoad = function () {
    const { existsSync, writeFileSync, mkdirSync, readFileSync } = global.nodemodule["fs-extra"];
    const { resolve } = global.nodemodule["path"];
    const path = resolve(__dirname, "cache", "shortcutdata.json");
    const pathMedia = resolve(__dirname, "cache", "shortcutMedia");

    if (!global.moduleData.shortcut) global.moduleData.shortcut = new Map();

    if (!existsSync(path)) writeFileSync(path, JSON.stringify([]), "utf-8");
    if (!existsSync(pathMedia)) mkdirSync(pathMedia, { recursive: true });

    const data = JSON.parse(readFileSync(path, "utf-8"));

    for (const threadData of data) global.moduleData.shortcut.set(threadData.threadID, threadData.shortcuts);

    return;
};

module.exports.handleEvent = async function ({ event, api, Users }) {
    const { threadID, messageID, body, senderID } = event;
    if (!global.moduleData.shortcut) global.moduleData.shortcut = new Map();
    if (!global.moduleData.shortcut.has(threadID)) return;
    const data = global.moduleData.shortcut.get(threadID);

    if (data.some(item => item.input == body)) {
        const { resolve } = global.nodemodule["path"];
        const { existsSync, createReadStream } = global.nodemodule["fs-extra"];
        const dataThread = data.find(item => item.input == body);
        const mediaPath = resolve(__dirname, "cache", "shortcutMedia", `${dataThread.id}`);

        var object, output;
        var output = dataThread.output;
        if (/\{name}/g.test(output)) {
            const name = global.data.userName.get(senderID) || await Users.getNameUser(senderID);
            output = output.replace(/\{name}/g, name);
        }

        if (existsSync(`${mediaPath}.gif`)) object = { body: output, attachment: createReadStream(`${mediaPath}.gif`) }
        else if (existsSync(`${mediaPath}.mp4`)) object = { body: output, attachment: createReadStream(`${mediaPath}.mp4`) }
        else object = { body: output };

        return api.sendMessage(object, threadID, messageID);
    }
};

module.exports.handleReply = async function ({ event, api, handleReply }) {
    if (handleReply.author != event.senderID) return;
    const { readFileSync, writeFileSync } = global.nodemodule["fs-extra"];
    const { resolve } = global.nodemodule["path"];
    const { threadID, messageID, senderID, body } = event;
    const name = this.config.name;

    const path = resolve(__dirname, "cache", "shortcutdata.json");
    const pathShortlink = resolve(__dirname, "cache", "shortlink.json");

    switch (handleReply.type) {
        case "requireInput": {
            if (body.length == 0) return api.sendMessage("Câu trả lời không được để trống!", threadID, messageID);
            const data = global.moduleData.shortcut.get(threadID) || [];
            if (data.some(item => item.input == body)) return api.sendMessage("Nội dung đã tồn tại từ trước!", threadID, messageID);
            api.unsendMessage(handleReply.messageID);
            return api.sendMessage("Reply tin nhắn này để nhập câu trả lời", threadID, function (error, info) {
                return global.client.handleReply.push({
                    type: "requireOutput",
                    name,
                    author: senderID,
                    messageID: info.messageID,
                    input: body
                });
            }, messageID);
        }
        case "requireOutput": {
            if (body.length == 0) return api.sendMessage("Câu trả lời không được để trống !", threadID, messageID);
            api.unsendMessage(handleReply.messageID);
            return api.sendMessage("Reply tin nhắn này nhập link video định dạng catbox/imgur hoặc nếu không muốn gửi video thì nhập 'nolink'", threadID, function (error, info) {
                return global.client.handleReply.push({
                    type: "requireMedia",
                    name,
                    author: senderID,
                    messageID: info.messageID,
                    input: handleReply.input,
                    output: body
                });
            }, messageID);
        }
        case "requireMedia": {
            const id = global.utils.randomString(10);
            let urls = [];
            if (fs.existsSync(pathShortlink)) {
                urls = JSON.parse(fs.readFileSync(pathShortlink, "utf-8"));
            }

            let mediaPath = "";
            if (body.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:gif|GIF)/g)) {
                mediaPath = resolve(__dirname, "cache", "shortcutMedia", `${id}.gif`);
            } else if (body.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:mp4|MP4)/g)) {
                mediaPath = resolve(__dirname, "cache", "shortcutMedia", `${id}.mp4`);
            }

            if (mediaPath) {
                try {
                    await global.utils.downloadFile(body, mediaPath);
                    urls.push(body);
                    writeFileSync(pathShortlink, JSON.stringify(urls, null, 4), "utf-8");
                } catch (e) {
                    return api.sendMessage("Không thể upload video vì url không tồn tại hoặc đã xảy ra lỗi !", threadID, messageID);
                }
            }

            const readData = readFileSync(path, "utf-8");
            var data = JSON.parse(readData);
            var dataThread = data.find(item => item.threadID == threadID) || { threadID, shortcuts: [] };
            var dataGlobal = global.moduleData.shortcut.get(threadID) || [];
            const object = { id, input: handleReply.input, output: handleReply.output };

            dataThread.shortcuts.push(object);
            dataGlobal.push(object);

            if (!data.some(item => item.threadID == threadID)) data.push(dataThread);
            else {
                const index = data.indexOf(data.find(item => item.threadID == threadID));
                data[index] = dataThread;
            }

            global.moduleData.shortcut.set(threadID, dataGlobal);
            writeFileSync(path, JSON.stringify(data, null, 4), "utf-8");

            return api.sendMessage(`Đã thêm thành công shortcut mới, dươi đây là phần tổng quát:\n- ID: ${id}\n- Nội dung: ${handleReply.input}\n- Gửi tin nhắn: ${handleReply.output}`, threadID, messageID);
        }
    }
};

module.exports.run = function ({ event, api, args }) {
    const { readFileSync, writeFileSync, existsSync } = global.nodemodule["fs-extra"];
    const { resolve } = global.nodemodule["path"];
    const { threadID, messageID, senderID } = event;
    const name = this.config.name;

    const path = resolve(__dirname, "cache", "shortcutdata.json");

    switch (args[0]) {
        case "remove":
        case "delete":
        case "del":
        case "-d": {
            const readData = readFileSync(path, "utf-8");
            var data = JSON.parse(readData);
            const indexData = data.findIndex(item => item.threadID == threadID);
            if (indexData == -1) return api.sendMessage("hiện tại nhóm của bạn chưa có shortcut nào được set !", threadID, messageID);
            var dataThread = data.find(item => item.threadID == threadID) || { threadID, shortcuts: [] };
            var dataGlobal = global.moduleData.shortcut.get(threadID) || [];
            var indexNeedRemove;

            if (dataThread.shortcuts.length == 0) return api.sendMessage("hiện tại nhóm của bạn chưa có shortcut nào được set !", threadID, messageID);

            if (isNaN(args[1])) indexNeedRemove = args[1];
            else indexNeedRemove = dataThread.shortcuts.findIndex(item => item.input == (args.slice(1, args.length)).join(" ") || item.id == (args.slice(1, args.length)).join(" "));

            dataThread.shortcuts.splice(indexNeedRemove, 1);
            dataGlobal.splice(indexNeedRemove, 1);

            global.moduleData.shortcut.set(threadID, dataGlobal);
            data[indexData] = dataThread;
            writeFileSync(path, JSON.stringify(data, null, 4), "utf-8");

            return api.sendMessage("Đã xóa thành công shortcut bạn yêu cầu", threadID, messageID);
        }

        case "all": {
            const readData = readFileSync(path, "utf-8");
            var data = JSON.parse(readData);
            const indexData = data.findIndex(item => item.threadID == threadID);
            if (indexData == -1) return api.sendMessage("hiện tại nhóm của bạn chưa có shortcut nào được set !", threadID, messageID);
            var dataThread = data.find(item => item.threadID == threadID) || { threadID, shortcuts: [] };

            if (dataThread.shortcuts.length == 0) return api.sendMessage("hiện tại nhóm của bạn chưa có shortcut nào được set !", threadID, messageID);

            var n = 1;
            var array = [];
            for (const item of dataThread.shortcuts) array.push(`${n++}/ Nội dung: ${item.input} | Gửi tin nhắn: ${item.output}`);
            return api.sendMessage(`Danh sách các shortcut của nhóm bạn gồm có ${dataThread.shortcuts.length} shortcut:\n\n${array.join("\n")}`, threadID, messageID);
        }

        case "empty":
        case "-e": {
            const readData = readFileSync(path, "utf-8");
            var data = JSON.parse(readData);
            const indexData = data.findIndex(item => item.threadID == threadID);
            if (indexData == -1) return api.sendMessage("hiện tại nhóm của bạn chưa có shortcut nào được set !", threadID, messageID);
            var dataThread = data.find(item => item.threadID == threadID) || { threadID, shortcuts: [] };
            var dataGlobal = global.moduleData.shortcut.get(threadID) || [];

            dataThread.shortcuts = [];
            dataGlobal = [];

            global.moduleData.shortcut.set(threadID, dataGlobal);
            data[indexData] = dataThread;
            writeFileSync(path, JSON.stringify(data, null, 4), "utf-8");

            return api.sendMessage("Đã xóa thành công toàn bộ shortcut của nhóm bạn !", threadID, messageID);
        }

        default: {
            return api.sendMessage("Dùng shortcut all/delete/empty để xem menu shortcut hoặc :\n\nReply tin nhắn này để nhập nội dung bạn muốn để bot trả lời", threadID, function (error, info) {
                return global.client.handleReply.push({
                    type: "requireInput",
                    name,
                    author: senderID,
                    messageID: info.messageID
                });
            }, messageID);
        }
    }
};

