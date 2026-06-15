const StatisticsService = require('../services/statisticsService');
const { success, error } = require('../utils/response');

class StatisticsController {
  // 获取总览统计
  static async getOverview(req, res) {
    try {
      const data = await StatisticsService.getOverview(req.user.id);
      res.json(success(data));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 获取今日统计
  static async getToday(req, res) {
    try {
      const data = await StatisticsService.getToday(req.user.id);
      res.json(success(data));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 获取本周统计
  static async getWeek(req, res) {
    try {
      const data = await StatisticsService.getWeek(req.user.id);
      res.json(success(data));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 获取本月统计
  static async getMonth(req, res) {
    try {
      const data = await StatisticsService.getMonth(req.user.id);
      res.json(success(data));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 获取月度趋势
  static async getTrend(req, res) {
    try {
      const { year } = req.query;
      const data = await StatisticsService.getTrend(req.user.id, year ? parseInt(year) : undefined);
      res.json(success(data));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 获取分类占比
  static async getCategoryStats(req, res) {
    try {
      const { type, start_date, end_date } = req.query;
      const data = await StatisticsService.getCategoryStats(req.user.id, { type, start_date, end_date });
      res.json(success(data));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 获取年度统计
  static async getYearly(req, res) {
    try {
      const { year } = req.query;
      const data = await StatisticsService.getYearly(req.user.id, year ? parseInt(year) : undefined);
      res.json(success(data));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }
}

module.exports = StatisticsController;
