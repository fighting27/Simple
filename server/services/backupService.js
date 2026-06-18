const db = require('../database/connection');
const Backup = require('../models/Backup');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const { getBackupDir } = require('../utils/pathConfig');

const BACKUP_DIR = getBackupDir();

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

class BackupService {
  // 导出为 Excel
  static async exportExcel(userId, { start_date, end_date } = {}) {
    let sql = `
      SELECT t.id, t.type, t.amount, c.name as category, t.note, t.transaction_date, t.created_at
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (start_date) {
      sql += ' AND t.transaction_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND t.transaction_date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY t.transaction_date DESC';

    const rows = db.prepare(sql).all(...params);

    // 格式化数据
    const data = rows.map(row => ({
      'ID': row.id,
      '类型': row.type === 'income' ? '收入' : '支出',
      '金额': row.amount,
      '分类': row.category,
      '备注': row.note,
      '日期': row.transaction_date,
      '创建时间': row.created_at,
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // 设置列宽
    ws['!cols'] = [
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
      { wch: 12 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, '收支记录');

    // 生成文件
    const filename = `记账数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    const filepath = path.join(BACKUP_DIR, filename);
    XLSX.writeFile(wb, filepath);

    // 记录备份
    const stats = fs.statSync(filepath);
    Backup.create(userId, {
      filename,
      file_path: filepath,
      file_size: stats.size,
      type: 'excel',
    });

    return { filepath, filename };
  }

  // 从 Excel 导入
  static async importExcel(userId, filepath) {
    const wb = XLSX.readFile(filepath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);

    if (data.length === 0) {
      throw new Error('文件为空');
    }

    // 获取所有分类（默认分类 + 用户自定义分类）
    const categories = db.prepare(
      'SELECT * FROM categories WHERE (user_id IS NULL AND is_default = 1) OR user_id = ?'
    ).all(userId);
    const categoryMap = {};
    for (const cat of categories) {
      categoryMap[cat.name] = cat;
    }

    const transactions = [];
    for (const row of data) {
      const type = row['类型'] === '收入' ? 'income' : 'expense';
      const categoryName = row['分类'];
      const category = categoryMap[categoryName];

      if (!category) {
        throw new Error(`分类 "${categoryName}" 不存在`);
      }

      transactions.push({
        type,
        amount: parseFloat(row['金额']),
        category_id: category.id,
        note: row['备注'] || '',
        transaction_date: row['日期'],
      });
    }

    // 批量插入
    const stmt = db.prepare(`
      INSERT INTO transactions (type, amount, category_id, note, transaction_date, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.type, item.amount, item.category_id, item.note, item.transaction_date, userId);
      }
    });

    insertMany(transactions);

    return { count: transactions.length };
  }

  // 创建 JSON 备份
  static async createBackup(userId) {
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.id
    `).all(userId);

    const categories = db.prepare(
      'SELECT * FROM categories WHERE (user_id IS NULL AND is_default = 1) OR user_id = ? ORDER BY id'
    ).all(userId);

    const settings = db.prepare('SELECT * FROM settings WHERE user_id = ? OR user_id IS NULL').all(userId);

    const backupData = {
      version: '1.0',
      created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      transactions,
      categories,
      settings,
    };

    const filename = `backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf-8');

    const stats = fs.statSync(filepath);
    const backup = Backup.create(userId, {
      filename,
      file_path: filepath,
      file_size: stats.size,
      type: 'json',
    });

    return backup;
  }

  // 恢复备份
  static async restoreBackup(userId, id) {
    const backup = Backup.findById(id);
    if (!backup) {
      throw new Error('备份不存在');
    }

    if (!fs.existsSync(backup.file_path)) {
      throw new Error('备份文件不存在');
    }

    const content = fs.readFileSync(backup.file_path, 'utf-8');
    const data = JSON.parse(content);

    const doRestore = db.transaction(() => {
      // 清空当前用户的数据
      db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM categories WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM settings WHERE user_id = ?').run(userId);

      // 只恢复用户自定义分类，默认分类已全局存在
      const insertCategory = db.prepare(`
        INSERT OR IGNORE INTO categories (name, type, icon, sort_order, is_default, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const cat of data.categories) {
        if (cat.is_default) continue;
        insertCategory.run(cat.name, cat.type, cat.icon, cat.sort_order, 0, userId, cat.created_at);
      }

      // 构建分类名→ID 映射（默认分类 + 当前用户的分类）
      const allCategories = db.prepare(
        'SELECT id, name FROM categories WHERE (user_id IS NULL AND is_default = 1) OR user_id = ?'
      ).all(userId);
      const categoryNameToId = {};
      for (const cat of allCategories) {
        categoryNameToId[cat.name] = cat.id;
      }

      // 恢复设置
      const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value, user_id) VALUES (?, ?, ?)');
      for (const setting of data.settings) {
        insertSetting.run(setting.key, setting.value, userId);
      }

      // 恢复交易记录（用分类名重新映射 category_id）
      const insertTransaction = db.prepare(`
        INSERT INTO transactions (type, amount, category_id, note, transaction_date, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const t of data.transactions) {
        const categoryId = categoryNameToId[t.category_name];
        if (!categoryId) continue;
        insertTransaction.run(t.type, t.amount, categoryId, t.note, t.transaction_date, userId, t.created_at, t.updated_at);
      }
    });

    doRestore();

    return {
      transactions: data.transactions.length,
      categories: data.categories.length,
      settings: data.settings.length,
    };
  }

  // 获取备份列表
  static async getList(userId) {
    return Backup.findAll(userId);
  }

  // 导出 JSON
  static async exportJson(userId) {
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `).all(userId);

    const categories = db.prepare(
      'SELECT * FROM categories WHERE (user_id IS NULL AND is_default = 1) OR user_id = ?'
    ).all(userId);

    const settings = db.prepare('SELECT * FROM settings WHERE user_id = ? OR user_id IS NULL').all(userId);

    return {
      version: '1.0',
      exported_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      transactions,
      categories,
      settings,
    };
  }

  // 导入 JSON
  static async importJson(userId, data) {
    if (!data.transactions || !data.categories) {
      throw new Error('无效的备份文件格式');
    }

    const doImport = db.transaction(() => {
      // 清空当前用户的数据
      db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM categories WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM settings WHERE user_id = ?').run(userId);

      // 只恢复用户自定义分类，默认分类已全局存在
      const insertCategory = db.prepare(`
        INSERT OR IGNORE INTO categories (name, type, icon, sort_order, is_default, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const cat of data.categories) {
        if (cat.is_default) continue;
        insertCategory.run(cat.name, cat.type, cat.icon, cat.sort_order, 0, userId, cat.created_at);
      }

      // 构建分类名→ID 映射（默认分类 + 当前用户的分类）
      const allCategories = db.prepare(
        'SELECT id, name FROM categories WHERE (user_id IS NULL AND is_default = 1) OR user_id = ?'
      ).all(userId);
      const categoryNameToId = {};
      for (const cat of allCategories) {
        categoryNameToId[cat.name] = cat.id;
      }

      // 恢复设置
      if (data.settings) {
        const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value, user_id) VALUES (?, ?, ?)');
        for (const setting of data.settings) {
          insertSetting.run(setting.key, setting.value, userId);
        }
      }

      // 恢复交易记录（优先用分类名映射，确保 category_id 有效）
      const insertTransaction = db.prepare(`
        INSERT INTO transactions (type, amount, category_id, note, transaction_date, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const t of data.transactions) {
        const categoryId = categoryNameToId[t.category_name];
        if (!categoryId) continue; // 找不到对应分类，跳过
        insertTransaction.run(t.type, t.amount, categoryId, t.note, t.transaction_date, userId, t.created_at, t.updated_at);
      }
    });

    doImport();

    return {
      transactions: data.transactions.length,
      categories: data.categories.length,
    };
  }
}

module.exports = BackupService;
