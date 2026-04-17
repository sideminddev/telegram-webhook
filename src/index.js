require('dotenv').config();

const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'http://127.0.0.1:3199';
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY;
const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;

if (!TELEGRAM_BOT_TOKEN || !PAPERCLIP_API_KEY) {
  console.error('Missing required environment variables: TELEGRAM_BOT_TOKEN, PAPERCLIP_API_KEY');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;
    const firstName = msg.from?.first_name || 'Unknown';

    if (!text || msg.type !== 'private') {
      return;
    }

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
  } catch (error) {
    console.error('Error processing message:', error.message);
    if (error.response) {
      console.error('Paperclip API error:', error.response.status, error.response.data);
    }
  }
});

console.log('Telegram bot started with Long Polling');