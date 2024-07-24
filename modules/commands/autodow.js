const axios = require("axios");
const fs = require("fs");

const isURL = (u) => /^http(|s):\/\//.test(u);

exports.handleEvent = async function (o) {
  try {
    const str = o.event.body;
    const send = (msg) =>
      o.api.sendMessage(msg, o.event.threadID, o.event.messageID);
    const head = (app) =>
      `==『 AUTODOWN ${app.toUpperCase()} 』==\n────────────────`;
    // const head = app => '';
    if (isURL(str)) {
      if (/fb|facebook/.test(str)) {
        //const data = await fbVideo(str);
        const res = await axios.get(`https://api.sumiproject.net/facebook/video?url=${str}`);
        send({
          body: `${head('FACEBOOK')}\nTiêu Đề : ${res.data.data.title}\n──────────────────\n
📺 Đây là tính năng tự động tải khi phát hiện link.`, attachment: await streamURL(res.data.data.video, 'mp4')
        });
      }
      /* TỰ ĐỘNG TẢI ẢNH HOẶC VIDEO TIKTOK */ 
       else if (/(^https:\/\/)((vm|vt|www|v)\.)?(tiktok|douyin)\.com\//.test(str)) {
                const json = await infoPostTT(str);
                let attachment = [];
                if (json.images != undefined) {
                    for (const $ of json.images) {
                        attachment.push(await streamURL($, 'png'));
                    }
                } else {
                    attachment = await streamURL(json.play, 'mp4');
                }
          o.api.sendMessage({body: `${head('TIKTOK')}\n→ Author: ${json.author.nickname}\n→ Tiêu Đề : ${json.title}\n→ Thả cảm xúc 👍 để lấy link tải nhạc.\n──────────────────\n
📺 Đây là tính năng tự động tải khi phát hiện link.`, attachment },o.event.threadID,(error, info) => {
    global.client.handleReaction.push({
      name: this.config.name, 
      messageID: info.messageID,
      author: o.event.senderID,
      data: json
          })
                },o.event.messageID);
                    } 
      /* TỰ ĐỘNG TẢI ẢNH HOẶC VIDEO YOUTUBE */ 
      else if (/(^https:\/\/)((www)\.)?(youtube|youtu)(PP)*\.(com|be)\//.test(str)) {
                let ytdl = require('ytdl-core');

               ytdl.getInfo(str).then(async info => {
                    let detail = info.videoDetails;
                    let format = info.formats.find(f => f.qualityLabel && f.qualityLabel.includes('360p') && f.audioBitrate);
                    if (format) {
                         send({
                              body: `${head('YOUTUBER')}\n- Tiêu Đề: ${detail.title}\n──────────────────\n
📺 Đây là tính năng tự động tải khi phát hiện link.`,
                              attachment: await streamURL(format.url, 'mp4')
                         });
                    } else {
                         console.error('Không tìm thấy định dạng phù hợp!');
                    }
            }) 
                    }
        /* TỰ ĐỘNG TẢI ẢNH HOẶC NHẠC SPOTIFY */ 
      else if(/spotify\.com/.test(str)){
        const url = (await axios.get(`https://api.phungtuanhai.online/spotify/download?apikey=PTH&link=${str}`)).data.audio
        send({body: `${head("SPOTIFY")}\n──────────────────\n
📺 Đây là tính năng tự động tải khi phát hiện link.`,attachment: await streamURL(url, 'mp3')})
      }
      /* TỰ ĐỘNG TẢI NHẠC ZINGMP3 */ 
      else if(/zingmp3\.vn/.test(str)){
          send({body: `${head('ZINGMP3')}\n──────────────────\n
📺 Đây là tính năng tự động tải khi phát hiện link.`,attachment: await streamURL(`https://hoanghao.me/api/zingmp3/download?link=${str}`, 'mp3')})
        }
      /* TỰ ĐỘNG TẢI ẢNH, VIDEO TWITTER */ 
      else if (/twitter\.com/.test(str)) {
      const res = (await axios.get(`https://hoanghao.me/api/twitter/download?url=${str}`)).data
      let attachment = [];
                      if (res.data.video_url != null) {
      attachment = await streamURL(res.data.video_url[1].url,"mp4")
      } else {
      attachment = await streamURL(res.data.media_url[0], 'jpg');
                      }
      send({body: `${head("TWITTER")}\n→ Tiêu đề: ${res.data.text}\n──────────────────\n
📺 Đây là tính năng tự động tải khi phát hiện link.`,attachment})
      }
      /* TỰ ĐỘNG TẢI ẢNH HOẶC VIDEO PINTEREST */ 
      else if (/(^https:\/\/)((www)\.)?(pinterest|pin)*\.(com|it)\//.test(str)) {
                const res = await axios.get(`https://api.imgbb.com/1/upload?key=588779c93c7187148b4fa9b7e9815da9&image=${str}`);
                send({
                    body: `${head('PINTEREST')}\n- link: ${res.data.data.image.url}\n──────────────────\n
📺 Đây là tính năng tự động tải khi phát hiện link.`, attachment: await streamURL(res.data.data.image.url, 'jpg')});
            } 
      /* TỰ ĐỘNG TẢI ẢNH HOẶC VIDEO INSTAGRAM */ 
      else if (/instagram\.com/.test(str)) {
                const res = await axios.get(`https://hoanghao.me/api/instagram/dlpost?url=${str}`);
                const {
                    videos = [{}],
                    images
                } = res.data;
                let attachment = [];

                if (videos[0] != undefined) {
                    attachment = await streamURL(videos[0], 'mp4');
                } else if (images != undefined) {
                    for (const $ of typeof images == 'string' ? [images]: images) {
                        attachment.push(await streamURL($, 'png'));
                    }
                }
                send({
                    body: `${head('INSTAGRAM')}\n→ Tiêu Đề: ${res.data.caption}\n──────────────────\n
📺 Đây là tính năng tự động tải khi phát hiện link.`, attachment
                });
            }
        }

    } catch(e) {
        console.log('Error', e);
    }
};
exports.run = () => {};
exports.handleReaction = async function (o){
  const { threadID: t, messageID: m, reaction: r } = o.event
  const { handleReaction: _ } = o
  if (r != "👍") return; 
  o.api.sendMessage({ body: `====『 MUSIC TIKTOK 』====\n────────────────\n→ ID: ${_.data.music_info.id}\n→ Title: ${_.data.music_info.title}\n→ Link: ${_.data.music_info.play}\n→ Thời gian: ${_.data.music_info.duration}\n──────────────────\n📺 Đây là tính năng tự động tải khi bạn thả cảm xúc 👍 .`,attachment: await streamURL(_.data.music, "mp3")},t,m)
}
exports.config = {
    name: 'autodow',
    version: '1',
    hasPermssion: 0,
    credits: 'Công Nam mod all Harin',
    description: '',
    commandCategory: 'Tiện ích',
    usages: [],
    cooldowns: 3
};

function streamURL(url, type) {
    return axios.get(url, {
        responseType: 'arraybuffer'
    }).then(res => {
        const path = __dirname + `/cache/${Date.now()}.${type}`;
        fs.writeFileSync(path, res.data);
        setTimeout(p => fs.unlinkSync(p), 1000 * 60, path);
        return fs.createReadStream(path);
    });
}

function infoPostTT(url) {
    return axios({
        method: 'post',
        url: `https://tikwm.com/api/`,
        data: {
            url
        },
        headers: {
            'content-type': 'application/json'
        }
    }).then(res => res.data.data);
  }