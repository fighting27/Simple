const SettingService = require('../services/settingService');
const { success, error } = require('../utils/response');

class SettingController {
  // 获取所有设置
  static async getAll(req, res) {
    try {
      const settings = await SettingService.getAll();
      res.json(success(settings));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 更新设置
  static async update(req, res) {
    try {
      const settings = await SettingService.update(req.body);
      res.json(success(settings, '设置更新成功'));
    } catch (err) {
      res.status(400).json(error(err.message, 400));
    }
  }

  // 检查预算
  static async checkBudget(req, res) {
    try {
      const data = await SettingService.checkBudget();
      res.json(success(data));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }
}

module.exports = SettingController;
