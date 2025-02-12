require("dotenv").config();
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const POINTS_API = "https://ceremony-backend.silentprotocol.org/users/points";
const POSITION_API = "https://ceremony-backend.silentprotocol.org/ceremony/position";

const userTokens = {};

const logFilePath = path.join(__dirname, "bot.log");

function logUser(username) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${username}\n`;
    console.log(logEntry);
    fs.appendFileSync(logFilePath, logEntry, "utf8");
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
    const username = msg.from.username || "Unknown";
    logUser(username);

    bot.sendMessage(
        msg.chat.id,
        "👋 Welcome to the Silent Protocols Point Checker!\n\n" +
        "To set your Bearer token, use:\n" +
        "/settoken YOUR-BEARER-TOKEN \n\n" +
        "Then, check your points with /checkpoints.\n" +
        "You can also check your queue position with /position.\n\n" +
        "☘️ Developed By HCA",
        { parse_mode: "Markdown" }
    );
});

bot.onText(/\/settoken (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || "Unknown";
    logUser(username);

    const token = match[1];
    userTokens[chatId] = token;
    bot.sendMessage(chatId, "✅ Token saved! Use /checkpoints or /position to check your stats.");
});

bot.onText(/\/checkpoints/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || "Unknown";
    logUser(username);

    if (!userTokens[chatId]) {
        bot.sendMessage(chatId, "⚠️ You haven't set your token yet! Use /settoken YOUR_BEARER_TOKEN.");
        return;
    }

    try {
        const response = await axios.get(POINTS_API, {
            headers: { Authorization: `Bearer ${userTokens[chatId]}` }
        });

        const { points, boostedPoints, boostMultiplier } = response.data;

        const message = `*Your Points Summary* 📊\n\n` +
            `✨ *Points:* ${points}\n` +
            `🚀 *Boosted Points:* ${boostedPoints}\n` +
            `🔥 *Multiplier:* ${boostMultiplier}x\n\n` +
            "Use /checkpoints to check again!\n\n" +
            "📢 Join Our Channel: [Happy Cuan Airdrop](https://t.me/HappyCuanAirdrop)";
        
        bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
        bot.sendMessage(
            chatId,
            "❌ *Failed to fetch points!*\n\n" +
            "🚨 Your token might be expired. Please update it using:\n" +
            "/settoken NEW_BEARER_TOKEN.",
            { parse_mode: "Markdown" }
        );

        delete userTokens[chatId];
    }
});

bot.onText(/\/position/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || "Unknown";
    logUser(username);

    if (!userTokens[chatId]) {
        bot.sendMessage(chatId, "⚠️ You haven't set your token yet! Use /settoken YOUR_BEARER_TOKEN.");
        return;
    }

    try {
        const response = await axios.get(POSITION_API, {
            headers: { Authorization: `Bearer ${userTokens[chatId]}` }
        });

        const { behind, timeRemaining } = response.data;

        const message = `*Your Queue Position* 📍\n\n` +
            `📉 *Users Behind You:* ${behind}\n` +
            `⏳ *Estimated Time Left:* ${timeRemaining}\n\n` +
            "Use /position to check again!\n\n" +
            "📢 Join Our Channel: [Happy Cuan Airdrop](https://t.me/HappyCuanAirdrop)";
        
        bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
        bot.sendMessage(
            chatId,
            "❌ *Failed to fetch your position!*\n\n" +
            "🚨 Your token might be expired. Please update it using:\n" +
            "/settoken NEW_BEARER_TOKEN.",
            { parse_mode: "Markdown" }
        );

        delete userTokens[chatId];
    }
});

console.log("🤖 Bot is running...");
