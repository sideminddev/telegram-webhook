const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'http://127.0.0.1:3199';
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL || '/webhook';
const PORT = process.env.SERVICE_PORT || 3000;
const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;

if (!TELEGRAM_BOT_TOKEN || !PAPERCLIP_API_KEY) {
  console.error('Missing required environment variables: TELEGRAM_BOT_TOKEN, PAPERCLIP_API_KEY');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

app.post(WEBHOOK_URL, async (req, res) => {
  try {
    const update = req.body;

    if (!update.message || !update.message.text) {
      res.status(200).send('OK');
      return;
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text;
    const firstName = message.from?.first_name || 'Unknown';

    console.log(`Received message from ${firstName}: ${text}`);

    const title = text.substring(0, 50).replace(/[^\w\s]/g, '').trim() || 'Nova mensagem do Telegram';

    const issuePayload = {
      title,
      description: text,
      status: 'todo',
      priority: 'medium',
      companyId: COMPANY_ID
    };

    const response = await axios.post(
      `${PAPERCLIP_API_URL}/api/issues`,
      issuePayload,
      {
        headers: {
          'Authorization': `Bearer ${PAPERCLIP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const issueId = response.data.identifier || response.data.id;
    console.log(`Created issue: ${issueId}`);

    await bot.sendMessage(chatId, `Issue criada: ${issueId}\n\n${title}`);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    if (error.response) {
      console.error('Paperclip API error:', error.response.status, error.response.data);
    }
    res.status(500).send('Error');
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Telegram webhook service listening on port ${PORT}`);
});

module.exports = app;