const db = require('../database/connection');

class Transaction {
  // 获取交易列表（支持筛选和分页）
  static findAll({ type, category_id, start_date, end_date, keyword, page = 1, page_size = 20 } = {}) {
    let where = [];
    let params = [];

    if (type) {
      where.push('t.type = ?');
      params.push(type);
    }

    if (category_id) {
      where.push('t.category_id = ?');
      params.push(category_id);
    }

    if (start_date) {
      where.push('t.transaction_date >= ?');
      params.push(start_date);
    }

    if (end_date) {
      where.push('t.transaction_date <= ?');
      params.push(end_date);
    }

    if (keyword) {
      where.push('(t.note LIKE ? OR c.name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
    `;
    const total = db.prepare(countSql).get(...params).total;

    // 查询列表
    const offset = (page - 1) * page_size;
    const listSql = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.type as category_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const list = db.prepare(listSql).all(...params, page_size, offset);

    return { list, total };
  }

  // 根据ID获取交易
  static findById(id) {
    return db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id);
  }

  // 创建交易
  static create({ type, amount, category_id, note = '', transaction_date }) {
    const stmt = db.prepare(`
      INSERT INTO transactions (type, amount, category_id, note, transaction_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(type, amount, category_id, note, transaction_date);
    return this.findById(result.lastInsertRowid);
  }

  // 更新交易
  static update(id, { type, amount, category_id, note, transaction_date }) {
    const fields = [];
    const params = [];

    if (type !== undefined) { fields.push('type = ?'); params.push(type); }
    if (amount !== undefined) { fields.push('amount = ?'); params.push(amount); }
    if (category_id !== undefined) { fields.push('category_id = ?'); params.push(category_id); }
    if (note !== undefined) { fields.push('note = ?'); params.push(note); }
    if (transaction_date !== undefined) { fields.push('transaction_date = ?'); params.push(transaction_date); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = datetime('now', 'localtime')");
    params.push(id);

    db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  // 删除交易
  static delete(id) {
    return db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  }

  // 批量创建（用于导入）
  static createMany(transactions) {
    const stmt = db.prepare(`
      INSERT INTO transactions (type, amount, category_id, note, transaction_date)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.type, item.amount, item.category_id, item.note || '', item.transaction_date);
      }
    });

    insertMany(transactions);
  }

  // 获取所有记录（用于导出）
  static exportAll({ start_date, end_date } = {}) {
    let sql = `
      SELECT t.*, c.name as category_name
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
    return db.prepare(sql).all(...params);
  }
}

module.exports = Transaction;
