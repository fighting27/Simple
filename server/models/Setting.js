const db = require('../database/connection');

class Setting {
  // 获取所有设置（用户级 + 全局级合并）
  static findAll(userId) {
    const globalSettings = db.prepare('SELECT * FROM settings WHERE user_id IS NULL').all();
    const userSettings = db.prepare('SELECT * FROM settings WHERE user_id = ?').all(userId);

    const settings = {};
    // 先加载全局设置
    for (const row of globalSettings) {
      settings[row.key] = row.value;
    }
    // 用户级设置覆盖全局设置
    for (const row of userSettings) {
      settings[row.key] = row.value;
    }

    return settings;
  }

  // 获取单个设置
  static findByKey(userId, key) {
    // 优先查用户级
    const userRow = db.prepare('SELECT value FROM settings WHERE key = ? AND user_id = ?').get(key, userId);
    if (userRow) return userRow.value;

    // 再查全局级
    const globalRow = db.prepare('SELECT value FROM settings WHERE key = ? AND user_id IS NULL').get(key);
    return globalRow ? globalRow.value : null;
  }

  // 更新设置（用户级）
  static update(userId, key, value) {
    const existing = db.prepare('SELECT id FROM settings WHERE key = ? AND user_id = ?').get(key, userId);

    if (existing) {
      db.prepare("UPDATE settings SET value = ?, updated_at = datetime('now', 'localtime') WHERE key = ? AND user_id = ?").run(value, key, userId);
    } else {
      db.prepare('INSERT INTO settings (key, value, user_id) VALUES (?, ?, ?)').run(key, value, userId);
    }

    return { key, value };
  }

  // 批量更新设置
  static updateMany(userId, settings) {
    const update = db.transaction((items) => {
      for (const [key, value] of Object.entries(items)) {
        this.update(userId, key, value);
      }
    });

    update(settings);
    return this.findAll(userId);
  }
}

module.exports = Setting;
