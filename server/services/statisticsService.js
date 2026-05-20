const db = require('../database/connection');
const dayjs = require('dayjs');

class StatisticsService {
  // 获取总览统计
  static async getOverview() {
    const totalIncome = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'").get().total;
    const totalExpense = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'").get().total;

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense,
    };
  }

  // 获取今日统计
  static async getToday() {
    const today = dayjs().format('YYYY-MM-DD');
    return this._getStatsByDate(today, today, '今日');
  }

  // 获取本周统计
  static async getWeek() {
    const start = dayjs().startOf('week').format('YYYY-MM-DD');
    const end = dayjs().endOf('week').format('YYYY-MM-DD');
    return this._getStatsByDate(start, end, '本周');
  }

  // 获取本月统计
  static async getMonth() {
    const start = dayjs().startOf('month').format('YYYY-MM-DD');
    const end = dayjs().endOf('month').format('YYYY-MM-DD');
    return this._getStatsByDate(start, end, '本月');
  }

  // 获取月度趋势
  static async getTrend(year) {
    const targetYear = year || dayjs().year();
    const results = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = dayjs(`${targetYear}-${month.toString().padStart(2, '0')}-01`).format('YYYY-MM-DD');
      const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');

      const income = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE type = 'income' AND transaction_date >= ? AND transaction_date <= ?
      `).get(startDate, endDate).total;

      const expense = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE type = 'expense' AND transaction_date >= ? AND transaction_date <= ?
      `).get(startDate, endDate).total;

      results.push({
        month: `${month}月`,
        income,
        expense,
        balance: income - expense,
      });
    }

    return results;
  }

  // 获取分类占比
  static async getCategoryStats({ type = 'expense', start_date, end_date } = {}) {
    let where = "WHERE t.type = ?";
    const params = [type];

    if (start_date) {
      where += " AND t.transaction_date >= ?";
      params.push(start_date);
    }
    if (end_date) {
      where += " AND t.transaction_date <= ?";
      params.push(end_date);
    }

    const stats = db.prepare(`
      SELECT
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        SUM(t.amount) as total_amount,
        COUNT(*) as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${where}
      GROUP BY t.category_id
      ORDER BY total_amount DESC
    `).all(...params);

    const total = stats.reduce((sum, item) => sum + item.total_amount, 0);

    return stats.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.total_amount / total) * 100).toFixed(1) : 0,
    }));
  }

  // 获取年度统计
  static async getYearly(year) {
    const targetYear = year || dayjs().year();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    const income = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'income' AND transaction_date >= ? AND transaction_date <= ?
    `).get(startDate, endDate).total;

    const expense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'expense' AND transaction_date >= ? AND transaction_date <= ?
    `).get(startDate, endDate).total;

    const monthlyStats = await this.getTrend(targetYear);

    return {
      year: targetYear,
      total_income: income,
      total_expense: expense,
      balance: income - expense,
      monthly: monthlyStats,
    };
  }

  // 内部方法：按日期范围获取统计
  static _getStatsByDate(startDate, endDate, label) {
    const income = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'income' AND transaction_date >= ? AND transaction_date <= ?
    `).get(startDate, endDate).total;

    const expense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'expense' AND transaction_date >= ? AND transaction_date <= ?
    `).get(startDate, endDate).total;

    const count = db.prepare(`
      SELECT COUNT(*) as total
      FROM transactions
      WHERE transaction_date >= ? AND transaction_date <= ?
    `).get(startDate, endDate).total;

    return {
      label,
      start_date: startDate,
      end_date: endDate,
      income,
      expense,
      balance: income - expense,
      count,
    };
  }
}

module.exports = StatisticsService;
