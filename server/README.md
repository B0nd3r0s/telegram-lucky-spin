
# Telegram Lucky Spin - Backend Server

This folder contains the backend server for the Telegram Lucky Spin application. The backend is built with Node.js and uses MongoDB for data storage.

## Project Structure

```
server/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request controllers
│   ├── middleware/     # Express middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── app.js          # Express app setup
├── .env.example        # Environment variables example
├── package.json        # Project dependencies
└── server.js          # Server entry point
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example` and fill in your:
   - MongoDB connection string
   - Telegram Bot API token
   - TON API credentials (for wallet integration)
   - JWT secret key

3. Start the server:
   ```
   npm start
   ```

For development:
```
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate a user with Telegram data

### Cases
- `GET /api/cases` - Get all cases
- `GET /api/cases/:id` - Get a specific case
- `POST /api/cases/open` - Open a case (requires authentication)

### User
- `GET /api/user` - Get current user data
- `PATCH /api/user` - Update user data
- `GET /api/user/inventory` - Get user's inventory

### Transactions
- `POST /api/transactions/deposit` - Deposit TON
- `POST /api/transactions/withdraw` - Withdraw a gift

### Live Feed
- `GET /api/live-wins` - Get recent wins

### Ratings
- `GET /api/ratings/top-players` - Get top players

### Referrals
- `GET /api/referrals/stats` - Get referral statistics

### Admin
- `GET /api/admin/cases` - Get all cases (admin only)
- `POST /api/admin/cases` - Create a case (admin only)
- `PATCH /api/admin/cases/:id` - Update a case (admin only)
- `DELETE /api/admin/cases/:id` - Delete a case (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `PATCH /api/admin/users/:id` - Update a user (admin only)
- `DELETE /api/admin/users/:id` - Delete a user (admin only)

## Database Schema

See the models directory for detailed MongoDB schemas.

## Telegram Bot Setup

1. Create a bot via BotFather
2. Set up webhooks for your bot
3. Configure the bot to work with Telegram Mini Apps

## Server Deployment

Follow these steps to deploy on Ubuntu server:

1. Update and install dependencies:
   ```
   sudo apt update
   sudo apt install -y nodejs npm mongodb nginx
   ```

2. Clone the repository and install dependencies:
   ```
   git clone [repository-url]
   cd server
   npm install
   ```

3. Set up MongoDB:
   ```
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

4. Create a PM2 process for the server:
   ```
   npm install -g pm2
   pm2 start server.js --name telegram-spin-server
   pm2 save
   pm2 startup
   ```

5. Configure Nginx:
   ```
   sudo nano /etc/nginx/sites-available/telegram-spin
   ```

   Add the following configuration:
   ```
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. Enable the site and restart Nginx:
   ```
   sudo ln -s /etc/nginx/sites-available/telegram-spin /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

7. Set up SSL with Certbot:
   ```
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Security Considerations

- Validate all Telegram authentication data
- Use rate limiting to prevent abuse
- Implement proper error handling and logging
- Secure MongoDB with authentication and network restrictions
- Keep your API tokens and secrets safe
