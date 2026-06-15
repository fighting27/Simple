const db = require('../database/connection');

class Backup {
  // 获取所有备份记录
  static findAll(userId) {
    return db.prepare('SELECT * FROM backups WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }

  // 根据ID获取备份
  static findById(id) {
    return db.prepare('SELECT * FROM backups WHERE id = ?').get(id);
  }

  // 创建备份记录
  static create(userId, { filename, file_path, file_size = 0, type = 'manual' }) {
    const stmt = db.prepare(`
      INSERT INTO backups (filename, file_path, file_size, type, user_id) VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(filename, file_path, file_size, type, userId);
    return this.findById(result.lastInsertRowid);
  }

  // 删除备份记录
  static delete(id) {
    return db.prepare('DELETE FROM backups WHERE id = ?').run(id);
  }
}

module.exports = Backup;
