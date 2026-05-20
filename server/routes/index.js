const express = require('express');
const router = express.Router();

const transactionRoutes = require('./transactionRoutes');
const categoryRoutes = require('./categoryRoutes');
const statisticsRoutes = require('./statisticsRoutes');
const backupRoutes = require('./backupRoutes');
const settingRoutes = require('./settingRoutes');

// 注册路由
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/backup', backupRoutes);
router.use('/settings', settingRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
