const Setting = require('../models/Setting');
const db = require('../database/connection');
const path = require('path');

class SettingService {
  // 获取所有设置
  static async getAll() {
    const settings = Setting.findAll();
    // 添加数据路径信息
    settings.data_path = path.join(__dirname, '..', 'data', 'money.db');
    return settings;
  }

  // 更新设置
  static async update(data) {
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

    return Setting.updateMany(updates);
  }

  // 检查预算
  static async checkBudget() {
    const budget = Setting.findByKey('monthly_budget');
    const alertEnabled = Setting.findByKey('budget_alert');

    if (!budget || alertEnabled !== '1') {
      return { exceeded: false };
    }

    const monthStart = require('dayjs')().startOf('month').format('YYYY-MM-DD');
    const monthEnd = require('dayjs')().endOf('month').format('YYYY-MM-DD');

    const result = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'expense' AND transaction_date >= ? AND transaction_date <= ?
    `).get(monthStart, monthEnd);

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
