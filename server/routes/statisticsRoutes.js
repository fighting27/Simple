const express = require('express');
const router = express.Router();
const StatisticsController = require('../controllers/statisticsController');

// GET /api/v1/statistics/overview - 总览统计
router.get('/overview', StatisticsController.getOverview);

// GET /api/v1/statistics/today - 今日统计
router.get('/today', StatisticsController.getToday);

// GET /api/v1/statistics/week - 本周统计
router.get('/week', StatisticsController.getWeek);

// GET /api/v1/statistics/month - 本月统计
router.get('/month', StatisticsController.getMonth);

// GET /api/v1/statistics/trend - 月度趋势
router.get('/trend', StatisticsController.getTrend);

// GET /api/v1/statistics/category - 分类占比
router.get('/category', StatisticsController.getCategoryStats);

// GET /api/v1/statistics/yearly - 年度统计
router.get('/yearly', StatisticsController.getYearly);

module.exports = router;
