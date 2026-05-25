import { loadEnvFile } from "./env-loader.mjs";

loadEnvFile();

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  process.stderr.write("Missing TELEGRAM_BOT_TOKEN\n");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`, {
  method: "GET"
});

const body = await response.json().catch(() => ({}));
if (!response.ok || body.ok === false) {
  process.stderr.write(`${body.description || `getUpdates failed: ${response.status}`}\n`);
  process.exit(1);
}

const chats = [];
const seen = new Set();
for (const update of body.result || []) {
  const message = update.message || update.edited_message || update.channel_post;
  const chat = message?.chat;
  if (!chat?.id || seen.has(chat.id)) continue;
  seen.add(chat.id);
  chats.push({
    chat_id: chat.id,
    type: chat.type,
    title: chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" "),
    username: chat.username ? `@${chat.username}` : undefined,
    latest_text: message.text
  });
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  count: chats.length,
  chats,
  hint: chats.length ? "Copy the chat_id into TELEGRAM_CHAT_ID." : "Send any message to the bot, then run this again."
}, null, 2)}\n`);
