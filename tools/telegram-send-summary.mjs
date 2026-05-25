import { loadEnvFile } from "./env-loader.mjs";
import { routeCommand } from "./telegram-command-router.mjs";
import { sendTelegramMessage } from "./telegram-webhook.mjs";

loadEnvFile();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID || process.argv[2];

if (!botToken) {
  process.stderr.write("Missing TELEGRAM_BOT_TOKEN\n");
  process.exit(1);
}

if (!chatId) {
  process.stderr.write("Missing TELEGRAM_CHAT_ID\n");
  process.exit(1);
}

const text = await routeCommand("/today");
const result = await sendTelegramMessage({ botToken, chatId, text });

process.stdout.write(`${JSON.stringify({
  ok: true,
  chat_id: chatId,
  message_id: result.result?.message_id,
  text
}, null, 2)}\n`);
