const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const transactionRoutes = require('./transactionRoutes');
const categoryRoutes = require('./categoryRoutes');
const statisticsRoutes = require('./statisticsRoutes');
const backupRoutes = require('./backupRoutes');
const settingRoutes = require('./settingRoutes');
const aiRoutes = require('./aiRoutes');
const authRoutes = require('./authRoutes');

// 公开路由（不需要认证）
router.use('/auth', authRoutes);

// 需要认证的路由
router.use(auth);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/backup', backupRoutes);
router.use('/settings', settingRoutes);
router.use('/ai', aiRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
