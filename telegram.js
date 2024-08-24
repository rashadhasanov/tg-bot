require("dotenv").config();
const schedule = require("node-schedule");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const feedbackChannelId = process.env.FEEDBACK_CHANNEL_ID;
const chatIdsFile = path.join(__dirname, "chat_ids.txt"); // Dosya yolu

if (!fs.existsSync(chatIdsFile)) {
  fs.writeFileSync(chatIdsFile, "");
}

const commands = ["/start", "/help", "/music", "/count", "/feedback"];

bot.onText(/\/(start|help|music|count|feedback)(?:@\w+)?/, (msg, match) => {
  const chatId = msg.chat.id;
  const command = match[1];

  if (
    !fs
      .readFileSync(chatIdsFile, "utf-8")
      .split("\n")
      .includes(chatId.toString())
  ) {
    fs.appendFileSync(chatIdsFile, `${chatId}\n`);
  }

  switch (command) {
    case "start":
      const firstName = msg.from.first_name || "İzahı bilinmir";
      const welcomeMessage =
        `🎉 Salam, ${firstName}!\n\n` +
        `🤖 Bu botda aşağıdakı əmrləri istifadə edə bilərsiniz:\n\n` +
        `📜 /help - Yardım mesajını göstər\n` +
        `🚀 /start - Botu başlatın və bu mesajı göstərin\n` +
        `🎵 /music - Random bir mahnı çal\n` +
        `📊 /count - Mövcud olan mahnıların sayını göstər\n` +
        `💬 /feedback - Geri bildirim və ya təklif verin (chatda /feedback yazaraq qarşısında mesajınızı yazın...)\n\n` +
        `🎧 Eclipsedən random mahnı seçmək üçün /music əmrinə basın!\n\n` +
        `📢 Kanalımıza abunə olun: @lleclipsell`;

      bot.sendMessage(chatId, welcomeMessage);

      const startMessage =
        `🚀 Bot başlatıldı!\n\n` +
        `🧑‍💻 İstifadəçi: ${firstName} (@${msg.from.username || "Yoxdur"})\n` +
        `📅 Tarix: ${new Date().toLocaleString()}`;
      bot.sendMessage(feedbackChannelId, startMessage);
      break;
    case "help":
      const helpMessage =
        `🤖 Yardım Məlumatı:\n\n` +
        `📜 /help - Yardım mesajını göstər\n` +
        `🚀 /start - Botu başlatın və bu mesajı göstərin\n` +
        `🎵 /music - Random bir mahnı çal\n` +
        `📊 /count - Mövcud olan mahnıların sayını göstər\n` +
        `💬 /feedback - Geri bildirim və ya təklif verin (chatda /feedback yazaraq qarşısında mesajınızı yazın...)\n\n` +
        `🎧 Xoş dinləmələr diləyirik!\n` +
        `📢 Daha çox məlumat üçün: @lleclipsell`;
      bot.sendMessage(chatId, helpMessage);
      break;
    case "music":
      const songIds = fs
        .readFileSync("song_ids.txt", "utf-8")
        .split("\n")
        .filter(Boolean);
      if (songIds.length === 0) {
        bot.sendMessage(chatId, "⚠️ Hələki mahnı yoxdur...");
        return;
      }
      const randomSongId = songIds[Math.floor(Math.random() * songIds.length)];
      bot.sendAudio(chatId, randomSongId, {
        caption:
          "🎵 Eclipsedən random mahnı seçdiniz. Xoş dinləmələr!\n\n🎧 @lleclipsell",
      });
      break;
    case "count":
      const songCount = fs
        .readFileSync("song_ids.txt", "utf-8")
        .split("\n")
        .filter(Boolean).length;
      const countMessage = `📊 Hazırda bazada ${songCount} mahnı var.`;
      bot.sendMessage(chatId, countMessage);
      break;
  }
});

bot.onText(/\/feedback (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const feedback = match[1];
  const userName = msg.from.username || "Yoxdur";
  const firstName = msg.from.first_name || "Yoxdur";

  const feedbackMessage =
    `💬 Yeni feedback:\n\n` +
    `User: ${firstName} (@${userName})\n` +
    `Message: ${feedback}`;

  bot
    .sendMessage(feedbackChannelId, feedbackMessage)
    .then(() => {
      bot.sendMessage(chatId, "💬 Geri bildiriminiz alındı. Təşəkkür edirik!");
    })
    .catch((error) => {
      console.error("Feedback göndərilmədi:", error);
      bot.sendMessage(
        chatId,
        "⚠️ Geri bildirim göndərilərkən xəta baş verdi. Zəhmət olmasa, yenidən cəhd edin."
      );
    });
});

bot.onText(/\/(.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const command = match[1].split(" ")[0];

  if (!commands.includes(`/${command}`)) {
    const unknownCommandMessage = `⚠️ Səni başa düşmürəm. Kömək al:\n\n /help`;
    bot.sendMessage(chatId, unknownCommandMessage);
  }
});

bot.on("channel_post", async (msg) => {
  if (msg.audio && msg.chat.id == "-1001776273152") {
    fs.appendFileSync("song_ids.txt", `${msg.audio.file_id}\n`);
  }
});

schedule.scheduleJob("0 10 * * *", () => {
  const chatIds = fs
    .readFileSync(chatIdsFile, "utf-8")
    .split("\n")
    .filter(Boolean);

  chatIds.forEach((chatId) => {
    bot
      .getChatMember(chatId, chatId)
      .then((member) => {
        const firstName = member.user.first_name || "Anonim";
        const message = `🌟 Salam, ${firstName}! 🌟\n
Gününüz xeyirli olsun! Bugünə gözəl bir başlanğıc üçün Eclipsedən təsadüfi bir mahnı dinləyə bilərsiniz. 🎵
Botu istifadə edərək, /music əmri ilə bu gözəl mahnıdan zövq ala bilərsiniz. 🎧
Xoş dinləmələr! 🎶`;
        bot.sendMessage(chatId, message);
      })
      .catch((error) => {
        console.log(error);
      });
  });
});
