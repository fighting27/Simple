const db = require('../database/connection');

class Setting {
  // 获取所有设置
  static findAll() {
    const rows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  // 获取单个设置
  static findByKey(key) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  }

  // 更新设置
  static update(key, value) {
    const existing = db.prepare('SELECT id FROM settings WHERE key = ?').get(key);

    if (existing) {
      db.prepare("UPDATE settings SET value = ?, updated_at = datetime('now', 'localtime') WHERE key = ?").run(value, key);
    } else {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
    }

    return { key, value };
  }

  // 批量更新设置
  static updateMany(settings) {
    const update = db.transaction((items) => {
      for (const [key, value] of Object.entries(items)) {
        this.update(key, value);
      }
    });

    update(settings);
    return this.findAll();
  }
}

module.exports = Setting;
