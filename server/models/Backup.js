const db = require('../database/connection');

class Backup {
  // 获取所有备份记录
  static findAll() {
    return db.prepare('SELECT * FROM backups ORDER BY created_at DESC').all();
  }

  // 根据ID获取备份
  static findById(id) {
    return db.prepare('SELECT * FROM backups WHERE id = ?').get(id);
  }

  // 创建备份记录
  static create({ filename, file_path, file_size = 0, type = 'manual' }) {
    const stmt = db.prepare(`
      INSERT INTO backups (filename, file_path, file_size, type) VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(filename, file_path, file_size, type);
    return this.findById(result.lastInsertRowid);
  }

  // 删除备份记录
  static delete(id) {
    return db.prepare('DELETE FROM backups WHERE id = ?').run(id);
  }
}

module.exports = Backup;
