const axios = require('axios');

module.exports.config = {
    name: "gpt",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Lemon, TatsuYTB [add reply]",
    description: "Chat với AI",
    commandCategory: "Thành Viên",
    usages: "[text]",
    cooldowns: 5,
};

const getChatResponse = async (text) => {
    try {
        const response = await axios.get(`https://api.sumiproject.net/gpt4?q=${encodeURIComponent(text)}`);
        if (response.data && response.data.data) {
            return response.data.data; 
        } else {
            throw new Error("Phản hồi API không có phần data");
        }
    } catch (error) {
        throw new Error("Không thể lấy phản hồi từ AI");
    }
};

const chatSessions = {};

module.exports.run = async ({ api, event, args }) => {
    try {
        const text = args.join(' ');
        if (!text) {
            return api.sendMessage('Vui lòng cung cấp nội dung để chat với AI.', event.threadID, event.messageID);
        }

        // Gửi thông báo chờ đợi
        api.sendMessage('Đang lấy dữ liệu từ GPT-4, vui lòng chờ...', event.threadID, event.messageID);

        const response = await getChatResponse(text);
        
        const messageID = await new Promise((resolve, reject) => {
            api.sendMessage(response, event.threadID, (error, info) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(info.messageID);
                }
            }, event.messageID);
        });
        
        chatSessions[messageID] = event.threadID;
    } catch (error) {
        api.sendMessage(`Có lỗi xảy ra: ${error.message}`, event.threadID, event.messageID);
    }
};

module.exports.handleReply = async ({ api, event }) => {
    try {
        const sessionThreadID = chatSessions[event.messageReply.messageID];

        if (sessionThreadID && sessionThreadID === event.threadID) {
            const text = event.body;
            const response = await getChatResponse(text);
            
            const messageID = await new Promise((resolve, reject) => {
                api.sendMessage(response, event.threadID, (error, info) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(info.messageID);
                    }
                }, event.messageID);
            });
            
            chatSessions[messageID] = event.threadID; 
        }
    } catch (error) {
        api.sendMessage(`Có lỗi xảy ra: ${error.message}`, event.threadID, event.messageID);
    }
};

module.exports.handleEvent = async function({ api, event }) {
    if (event.type === "message_reply") {
        await this.handleReply({ api, event });
    }
};

module.exports.languages = {
    "vi": {
        "description": "Chat với AI thông qua API"
    }
};
