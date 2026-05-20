const db = require('../database/connection');

class Category {
  // 获取所有分类
  static findAll(type = null) {
    let sql = 'SELECT * FROM categories';
    const params = [];

    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }

    sql += ' ORDER BY sort_order ASC, id ASC';
    return db.prepare(sql).all(...params);
  }

  // 根据ID获取分类
  static findById(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  // 创建分类
  static create({ name, type, icon = '', sort_order = 0 }) {
    const stmt = db.prepare(`
      INSERT INTO categories (name, type, icon, sort_order) VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, type, icon, sort_order);
    return this.findById(result.lastInsertRowid);
  }

  // 更新分类
  static update(id, { name, icon, sort_order }) {
    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (icon !== undefined) { fields.push('icon = ?'); params.push(icon); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); params.push(sort_order); }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  // 删除分类
  static delete(id) {
    // 检查是否有关联的交易记录
    const count = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE category_id = ?').get(id);
    if (count.count > 0) {
      throw new Error('该分类下有交易记录，无法删除');
    }

    // 检查是否为默认分类
    const category = this.findById(id);
    if (category && category.is_default) {
      throw new Error('默认分类不能删除');
    }

    return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  // 检查名称是否存在
  static existsByName(name, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM categories WHERE name = ?';
    const params = [name];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    return db.prepare(sql).get(...params).count > 0;
  }
}

module.exports = Category;
