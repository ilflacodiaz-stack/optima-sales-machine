import { routeCommand } from "./telegram-command-router.mjs";
import { loadEnvFile } from "./env-loader.mjs";

loadEnvFile();

export function parseTelegramUpdate(update = {}) {
  const message = update.message || update.edited_message || update.channel_post || {};
  const chatId = message.chat?.id;
  const text = message.text || "";

  return {
    chatId,
    text,
    messageId: message.message_id,
    from: message.from
  };
}

export async function sendTelegramMessage({ botToken, chatId, text }) {
  if (!botToken) {
    return { ok: false, skipped: true, reason: "Missing TELEGRAM_BOT_TOKEN" };
  }

  if (!chatId) {
    return { ok: false, skipped: true, reason: "Missing chat_id" };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.description || `Telegram sendMessage failed: ${response.status}`);
  }

  return body;
}

export async function handleTelegramUpdate(update, options = {}) {
  const parsed = parseTelegramUpdate(update);
  const reply = await routeCommand(parsed.text);
  const sendResult = await sendTelegramMessage({
    botToken: options.botToken || process.env.TELEGRAM_BOT_TOKEN,
    chatId: parsed.chatId,
    text: reply
  });

  return {
    ok: true,
    chat_id: parsed.chatId,
    command: parsed.text,
    reply,
    send_result: sendResult
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const text = process.argv.slice(2).join(" ") || "/today";
    const result = await handleTelegramUpdate({
      message: {
        message_id: 1,
        chat: { id: 123456 },
        text
      }
    }, { botToken: "" });

    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
