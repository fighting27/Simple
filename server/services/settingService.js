const Setting = require('../models/Setting');
const User = require('../models/User');
const db = require('../database/connection');
const { getDbPath } = require('../utils/pathConfig');

class SettingService {
  // 获取所有设置
  static async getAll(userId) {
    const settings = Setting.findAll(userId);
    // 如果 settings 中没有 nickname，从 users 表获取
    if (!settings.nickname) {
      const user = User.findById(userId);
      if (user && user.nickname) {
        settings.nickname = user.nickname;
      }
    }
    // 添加数据路径信息
    settings.data_path = getDbPath();
    return settings;
  }

  // 更新设置
  static async update(userId, data) {
    const allowedKeys = ['nickname', 'monthly_budget', 'budget_alert'];
    const updates = {};

    for (const [key, value] of Object.entries(data)) {
      if (allowedKeys.includes(key)) {
        updates[key] = String(value);
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('没有有效的设置项');
    }

    // 如果更新了昵称，同步更新 users 表
    if (updates.nickname) {
      User.updateProfile(userId, { nickname: updates.nickname });
    }

    return Setting.updateMany(userId, updates);
  }

  // 检查预算
  static async checkBudget(userId) {
    const budget = Setting.findByKey(userId, 'monthly_budget');
    const alertEnabled = Setting.findByKey(userId, 'budget_alert');

    if (!budget || alertEnabled !== '1') {
      return { exceeded: false };
    }

    const monthStart = require('dayjs')().startOf('month').format('YYYY-MM-DD');
    const monthEnd = require('dayjs')().endOf('month').format('YYYY-MM-DD');

    const result = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'expense' AND transaction_date >= ? AND transaction_date <= ? AND user_id = ?
    `).get(monthStart, monthEnd, userId);

    const monthlyExpense = result.total;
    const budgetAmount = parseFloat(budget);

    return {
      exceeded: monthlyExpense > budgetAmount,
      budget: budgetAmount,
      spent: monthlyExpense,
      remaining: budgetAmount - monthlyExpense,
      percentage: ((monthlyExpense / budgetAmount) * 100).toFixed(1),
    };
  }
}

module.exports = SettingService;
