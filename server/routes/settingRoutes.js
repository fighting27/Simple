const express = require('express');
const router = express.Router();
const SettingController = require('../controllers/settingController');

// GET /api/v1/settings - 获取所有设置
router.get('/', SettingController.getAll);

// PUT /api/v1/settings - 更新设置
router.put('/', SettingController.update);

// GET /api/v1/settings/budget - 检查预算
router.get('/budget', SettingController.checkBudget);

module.exports = router;
