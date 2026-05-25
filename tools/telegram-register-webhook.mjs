import { loadEnvFile } from "./env-loader.mjs";

loadEnvFile();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const publicWebhookUrl = process.env.PUBLIC_WEBHOOK_URL;

if (!botToken) {
  process.stderr.write("Missing TELEGRAM_BOT_TOKEN\n");
  process.exit(1);
}

if (!publicWebhookUrl) {
  process.stderr.write("Missing PUBLIC_WEBHOOK_URL\n");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: publicWebhookUrl,
    allowed_updates: ["message", "edited_message"]
  })
});

const body = await response.json().catch(() => ({}));
if (!response.ok || body.ok === false) {
  process.stderr.write(`${body.description || `setWebhook failed: ${response.status}`}\n`);
  process.exit(1);
}

process.stdout.write(`${JSON.stringify(body, null, 2)}\n`);
