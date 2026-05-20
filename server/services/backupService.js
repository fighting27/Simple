const db = require('../database/connection');
const Backup = require('../models/Backup');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

class BackupService {
  // 导出为 Excel
  static async exportExcel({ start_date, end_date } = {}) {
    let sql = `
      SELECT t.id, t.type, t.amount, c.name as category, t.note, t.transaction_date, t.created_at
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
    `;
    const params = [];
    const where = [];

    if (start_date) {
      where.push('t.transaction_date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      where.push('t.transaction_date <= ?');
      params.push(end_date);
    }

    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
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
    Backup.create({
      filename,
      file_path: filepath,
      file_size: stats.size,
      type: 'excel',
    });

    return { filepath, filename };
  }

  // 从 Excel 导入
  static async importExcel(filepath) {
    const wb = XLSX.readFile(filepath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);

    if (data.length === 0) {
      throw new Error('文件为空');
    }

    // 获取所有分类
    const categories = db.prepare('SELECT * FROM categories').all();
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
      INSERT INTO transactions (type, amount, category_id, note, transaction_date)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.type, item.amount, item.category_id, item.note, item.transaction_date);
      }
    });

    insertMany(transactions);

    return { count: transactions.length };
  }

  // 创建 JSON 备份
  static async createBackup() {
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.id
    `).all();

    const categories = db.prepare('SELECT * FROM categories ORDER BY id').all();
    const settings = db.prepare('SELECT * FROM settings').all();

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
    const backup = Backup.create({
      filename,
      file_path: filepath,
      file_size: stats.size,
      type: 'json',
    });

    return backup;
  }

  // 恢复备份
  static async restoreBackup(id) {
    const backup = Backup.findById(id);
    if (!backup) {
      throw new Error('备份不存在');
    }

    if (!fs.existsSync(backup.file_path)) {
      throw new Error('备份文件不存在');
    }

    const content = fs.readFileSync(backup.file_path, 'utf-8');
    const data = JSON.parse(content);

    // 清空现有数据
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM categories');
    db.exec('DELETE FROM settings');

    // 恢复分类
    const insertCategory = db.prepare(`
      INSERT INTO categories (id, name, type, icon, sort_order, is_default, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const cat of data.categories) {
      insertCategory.run(cat.id, cat.name, cat.type, cat.icon, cat.sort_order, cat.is_default, cat.created_at);
    }

    // 恢复设置
    const insertSetting = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
    `);

    for (const setting of data.settings) {
      insertSetting.run(setting.key, setting.value);
    }

    // 恢复交易记录
    const insertTransaction = db.prepare(`
      INSERT INTO transactions (id, type, amount, category_id, note, transaction_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of data.transactions) {
      insertTransaction.run(t.id, t.type, t.amount, t.category_id, t.note, t.transaction_date, t.created_at, t.updated_at);
    }

    return {
      transactions: data.transactions.length,
      categories: data.categories.length,
      settings: data.settings.length,
    };
  }

  // 获取备份列表
  static async getList() {
    return Backup.findAll();
  }

  // 导出 JSON
  static async exportJson() {
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
    `).all();

    const categories = db.prepare('SELECT * FROM categories').all();
    const settings = db.prepare('SELECT * FROM settings').all();

    return {
      version: '1.0',
      exported_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      transactions,
      categories,
      settings,
    };
  }

  // 导入 JSON
  static async importJson(data) {
    if (!data.transactions || !data.categories) {
      throw new Error('无效的备份文件格式');
    }

    // 清空现有数据
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM categories');
    db.exec('DELETE FROM settings');

    // 恢复分类
    const insertCategory = db.prepare(`
      INSERT INTO categories (id, name, type, icon, sort_order, is_default, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const cat of data.categories) {
      insertCategory.run(cat.id, cat.name, cat.type, cat.icon, cat.sort_order, cat.is_default, cat.created_at);
    }

    // 恢复设置
    if (data.settings) {
      const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
      for (const setting of data.settings) {
        insertSetting.run(setting.key, setting.value);
      }
    }

    // 恢复交易记录
    const insertTransaction = db.prepare(`
      INSERT INTO transactions (id, type, amount, category_id, note, transaction_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of data.transactions) {
      insertTransaction.run(t.id, t.type, t.amount, t.category_id, t.note, t.transaction_date, t.created_at, t.updated_at);
    }

    return {
      transactions: data.transactions.length,
      categories: data.categories.length,
    };
  }
}

module.exports = BackupService;
