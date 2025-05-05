
require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Start command
bot.start(async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || `user_${telegramId}`;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name || '';
    
    // Check if user exists in database
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    
    if (!existingUser) {
      // Check if this user should be an admin
      const isAdmin = process.env.ADMIN_TELEGRAM_IDS.split(',').includes(telegramId.toString());
      
      // Create new user
      await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          username: username,
          first_name: firstName,
          last_name: lastName,
          photo_url: '',
          role: isAdmin ? 'admin' : 'user'
        });
      
      ctx.reply(`Welcome to Lucky Spin, ${firstName}! You've been registered successfully.`);
    } else {
      ctx.reply(`Welcome back to Lucky Spin, ${firstName}!`);
    }
    
    // Send the web app link
    ctx.reply('Open the Lucky Spin web application:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Open Lucky Spin', web_app: { url: process.env.WEB_APP_URL } }]
        ]
      }
    });
  } catch (error) {
    console.error('Error in start command:', error);
    ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Help command
bot.help((ctx) => {
  ctx.reply(`
Lucky Spin Bot Help:

/start - Start the bot and get the web app link
/help - Show this help message
/balance - Check your current balance
/cases - View available cases
/invite - Get your referral link

For more actions, please use the web application.
  `);
});

// Balance command
bot.command('balance', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    
    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('balance')
      .eq('telegram_id', telegramId)
      .single();
    
    if (error || !user) {
      return ctx.reply('You need to register first. Please use the /start command.');
    }
    
    ctx.reply(`Your current balance: ${user.balance} TON`);
  } catch (error) {
    console.error('Error in balance command:', error);
    ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Start the bot
bot.launch()
  .then(() => console.log('Telegram bot started'))
  .catch((err) => console.error('Error starting Telegram bot:', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
