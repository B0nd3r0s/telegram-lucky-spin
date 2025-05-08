
# Telegram Lucky Spin

A Telegram Mini App for opening cases and winning prizes, with TON blockchain integration.

## Features

- 🎮 Case opening with chances for winning different prizes
- 💰 TON blockchain integration for deposits and withdrawals
- 🔄 Gift upgrade system with two modes
- 👑 User rankings and live feed
- 🎁 Invitation and referral system
- 📊 Admin panel for managing cases, users, and finances

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Telegram Bot Token](https://core.telegram.org/bots#creating-a-new-bot)
- [TON API Key](https://toncenter.com/api/v2/) (for blockchain integration)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/telegram-lucky-spin.git
   cd telegram-lucky-spin
   ```

2. Create your environment files:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```

3. Edit the `.env` and `server/.env` files with your configuration:
   - Set `TELEGRAM_BOT_TOKEN` to your Telegram bot token
   - Set `TON_API_KEY` to your TON API key
   - Set `TON_WALLET_ADDRESS` to your TON wallet address
   - Set `ADMIN_TELEGRAM_IDS` to comma-separated list of admin Telegram IDs
   - Generate a random string for `JWT_SECRET`
   - Adjust other settings as needed

### Deployment with Docker

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. The application should now be running at:
   - Client: http://localhost (port 80)
   - Server API: http://localhost:3000

3. Access the MongoDB database:
   - Connection string: `mongodb://localhost:27017/telegram-lucky-spin`

### Manual Development Setup

#### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

#### Client Setup

1. Navigate to the project root:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Application Structure

- `/src` - React frontend code
  - `/components` - Reusable UI components
  - `/pages` - Application pages
  - `/lib` - Utilities and helpers
  - `/contexts` - React context providers
  - `/hooks` - Custom React hooks
  - `/types` - TypeScript type definitions

- `/server` - Node.js backend code
  - `/src/controllers` - API controllers
  - `/src/middleware` - Express middleware
  - `/src/models` - MongoDB models
  - `/src/routes` - API routes
  - `/src/utils` - Utility functions

## Integrating with Telegram

1. Set up your Telegram bot with BotFather
2. Configure the Telegram Mini App settings
3. Add the bot to your Telegram channel or group
4. Share the Mini App link with your users

## Support

If you have any questions or need assistance, please raise an issue in the repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
