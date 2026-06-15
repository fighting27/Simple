const db = require('../database/connection');

class Category {
  // 获取所有分类（默认分类 + 用户自定义分类）
  static findAll(userId, type = null) {
    let sql = 'SELECT * FROM categories WHERE (user_id IS NULL AND is_default = 1) OR user_id = ?';
    const params = [userId];

    if (type) {
      sql += ' AND type = ?';
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
  static create(userId, { name, type, icon = '', sort_order = 0 }) {
    const stmt = db.prepare(`
      INSERT INTO categories (name, type, icon, sort_order, user_id) VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, type, icon, sort_order, userId);
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

  // 检查名称是否存在（同一用户下）
  static existsByName(userId, name, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM categories WHERE (name = ? AND user_id = ?) OR (name = ? AND is_default = 1)';
    const params = [name, userId, name];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    return db.prepare(sql).get(...params).count > 0;
  }
}

module.exports = Category;
