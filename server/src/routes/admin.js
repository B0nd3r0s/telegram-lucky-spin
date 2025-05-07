
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Case = require('../models/Case');
const Gift = require('../models/Gift');
const Transaction = require('../models/Transaction');

// Защищаем все админские маршруты
router.use(isAdmin);

// Получить статистику платформы
router.get('/stats', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCases = await Case.countDocuments();
    
    // Подсчет общего объема транзакций
    const transactions = await Transaction.find();
    const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Подсчет общей прибыли (разница между стоимостью кейсов и выплат)
    const casePurchases = await Transaction.find({ type: 'case_purchase' });
    const withdrawals = await Transaction.find({ type: 'withdrawal' });
    
    const casePurchaseTotal = casePurchases.reduce((sum, tx) => sum + tx.amount, 0);
    const withdrawalTotal = withdrawals.reduce((sum, tx) => sum + tx.amount, 0);
    
    const profit = casePurchaseTotal - withdrawalTotal;
    
    res.json({
      totalUsers,
      totalCases,
      casesOpened: casePurchases.length,
      totalVolume,
      profit
    });
  } catch (error) {
    next(error);
  }
});

// Получить список пользователей с пагинацией
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Получить информацию о конкретном пользователе
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Обновить пользователя (например, заблокировать/разблокировать)
router.put('/users/:id', async (req, res, next) => {
  try {
    const { isBlocked, role, balance } = req.body;
    
    const updateData = {};
    if (typeof isBlocked === 'boolean') updateData.isBlocked = isBlocked;
    if (role) updateData.role = role;
    if (typeof balance === 'number') updateData.balance = balance;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Получить список всех кейсов
router.get('/cases', async (req, res, next) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    next(error);
  }
});

// Создать новый кейс
router.post('/cases', async (req, res, next) => {
  try {
    const { name, imageUrl, price, description, possibleGifts } = req.body;
    
    // Проверка суммы вероятностей
    const totalChance = possibleGifts.reduce((sum, gift) => sum + gift.chance, 0);
    if (Math.abs(totalChance - 100) > 0.01) {
      return res.status(400).json({
        message: 'Total chance must be 100%',
        currentTotal: totalChance
      });
    }
    
    const newCase = new Case({
      name,
      imageUrl,
      price,
      description,
      possibleGifts
    });
    
    await newCase.save();
    res.status(201).json(newCase);
  } catch (error) {
    next(error);
  }
});

// Обновить существующий кейс
router.put('/cases/:id', async (req, res, next) => {
  try {
    const { name, imageUrl, price, description, possibleGifts, isActive } = req.body;
    
    // Если предоставлены possibleGifts, проверить сумму вероятностей
    if (possibleGifts) {
      const totalChance = possibleGifts.reduce((sum, gift) => sum + gift.chance, 0);
      if (Math.abs(totalChance - 100) > 0.01) {
        return res.status(400).json({
          message: 'Total chance must be 100%',
          currentTotal: totalChance
        });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (price) updateData.price = price;
    if (description !== undefined) updateData.description = description;
    if (possibleGifts) updateData.possibleGifts = possibleGifts;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    res.json(updatedCase);
  } catch (error) {
    next(error);
  }
});

// Удалить кейс
router.delete('/cases/:id', async (req, res, next) => {
  try {
    const deletedCase = await Case.findByIdAndDelete(req.params.id);
    
    if (!deletedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Получить последние транзакции
router.get('/transactions', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find()
      .populate('user', 'telegramId username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transaction.countDocuments();
    
    res.json({
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
