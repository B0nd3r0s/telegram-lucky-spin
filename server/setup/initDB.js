
/**
 * MongoDB Database initialization script
 * Run this script to set up the initial database structure and seed data
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Case = require('../src/models/Case');
const Gift = require('../src/models/Gift');
const Transaction = require('../src/models/Transaction');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Seed admin user
const seedAdminUser = async () => {
  try {
    // Check if admin user exists
    const adminIds = process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => parseInt(id));
    
    if (adminIds.length === 0) {
      console.warn('No admin Telegram IDs specified in .env file');
      return;
    }
    
    for (const telegramId of adminIds) {
      const existingAdmin = await User.findOne({ telegramId });
      
      if (!existingAdmin) {
        await User.create({
          telegramId,
          username: `admin_${telegramId}`,
          firstName: 'Admin',
          role: 'admin',
          balance: 1000, // Give admin some initial balance
        });
        console.log(`Created admin user with Telegram ID ${telegramId}`);
      } else if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`Updated user ${telegramId} to admin role`);
      } else {
        console.log(`Admin user with Telegram ID ${telegramId} already exists`);
      }
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Seed initial cases
const seedCases = async () => {
  try {
    const casesCount = await Case.countDocuments();
    
    if (casesCount === 0) {
      // Create basic cases
      const cases = [
        {
          name: 'Basic Case',
          imageUrl: '/images/cases/basic-case.png',
          price: 5,
          description: 'A basic case with common gifts',
          possibleGifts: [
            { name: 'TON x1', imageUrl: '/images/gifts/ton-1.png', value: 1, chance: 70 },
            { name: 'TON x5', imageUrl: '/images/gifts/ton-5.png', value: 5, chance: 20 },
            { name: 'TON x10', imageUrl: '/images/gifts/ton-10.png', value: 10, chance: 10 }
          ]
        },
        {
          name: 'Premium Case',
          imageUrl: '/images/cases/premium-case.png',
          price: 20,
          description: 'A premium case with better gifts',
          possibleGifts: [
            { name: 'TON x10', imageUrl: '/images/gifts/ton-10.png', value: 10, chance: 60 },
            { name: 'TON x20', imageUrl: '/images/gifts/ton-20.png', value: 20, chance: 30 },
            { name: 'TON x50', imageUrl: '/images/gifts/ton-50.png', value: 50, chance: 10 }
          ]
        },
        {
          name: 'Luxury Case',
          imageUrl: '/images/cases/luxury-case.png',
          price: 50,
          description: 'A luxury case with rare gifts',
          possibleGifts: [
            { name: 'TON x25', imageUrl: '/images/gifts/ton-25.png', value: 25, chance: 50 },
            { name: 'TON x75', imageUrl: '/images/gifts/ton-75.png', value: 75, chance: 40 },
            { name: 'TON x200', imageUrl: '/images/gifts/ton-200.png', value: 200, chance: 10 }
          ]
        },
      ];
      
      await Case.insertMany(cases);
      console.log(`Created ${cases.length} initial cases`);
    } else {
      console.log(`${casesCount} cases already exist, skipping seed`);
    }
  } catch (error) {
    console.error('Error creating cases:', error);
  }
};

// Run the seed operations
const runSeed = async () => {
  try {
    await seedAdminUser();
    await seedCases();
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    mongoose.disconnect();
  }
};

runSeed();
