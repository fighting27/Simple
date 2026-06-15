const db = require('./connection');

function migration() {
  console.log('数据库迁移开始...');

  // 重建表时需要临时关闭外键检查
  db.pragma('foreign_keys = OFF');

  // 检查 transactions 表是否有 user_id 列
  const transactionCols = db.prepare("PRAGMA table_info(transactions)").all();
  if (!transactionCols.find(c => c.name === 'user_id')) {
    db.exec('ALTER TABLE transactions ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0');
    db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)');
    console.log('transactions 表添加 user_id 列');
  }

  // 检查 categories 表是否有 user_id 列
  const categoryCols = db.prepare("PRAGMA table_info(categories)").all();
  if (!categoryCols.find(c => c.name === 'user_id')) {
    db.exec('ALTER TABLE categories ADD COLUMN user_id INTEGER DEFAULT NULL');
    db.exec('CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id)');
    console.log('categories 表添加 user_id 列');
  }

  // 重建 categories 表，将 UNIQUE(name) 改为 UNIQUE(name, user_id)
  const categoryIndexes = db.prepare("PRAGMA index_list(categories)").all();
  const nameUniqueIndex = categoryIndexes.find(idx => {
    if (!idx.unique) return false;
    const info = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
    return info.length === 1 && info[0].name === 'name';
  });
  if (nameUniqueIndex) {
    db.exec(`DROP TABLE IF EXISTS categories_new`);
    db.exec(`
      CREATE TABLE categories_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        icon TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        is_default INTEGER DEFAULT 0,
        user_id INTEGER DEFAULT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        UNIQUE(name, user_id)
      )
    `);
    db.exec(`INSERT INTO categories_new (id, name, type, icon, sort_order, is_default, user_id, created_at) SELECT id, name, type, icon, sort_order, is_default, user_id, created_at FROM categories`);
    db.exec(`DROP TABLE categories`);
    db.exec(`ALTER TABLE categories_new RENAME TO categories`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id)');
    console.log('categories 表 UNIQUE 约束已更新为 (name, user_id)');
  }

  // 检查 settings 表是否有 user_id 列
  const settingCols = db.prepare("PRAGMA table_info(settings)").all();
  if (!settingCols.find(c => c.name === 'user_id')) {
    db.exec('ALTER TABLE settings ADD COLUMN user_id INTEGER DEFAULT NULL');
    db.exec('CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id)');
    console.log('settings 表添加 user_id 列');
  }

  // 重建 settings 表，将 UNIQUE(key) 改为 UNIQUE(key, user_id)
  const settingsIndexes = db.prepare("PRAGMA index_list(settings)").all();
  const keyUniqueIndex = settingsIndexes.find(idx => {
    if (!idx.unique) return false;
    const info = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
    return info.length === 1 && info[0].name === 'key';
  });
  if (keyUniqueIndex) {
    db.exec(`DROP TABLE IF EXISTS settings_new`);
    db.exec(`
      CREATE TABLE settings_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        user_id INTEGER DEFAULT NULL,
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        UNIQUE(key, user_id)
      )
    `);
    db.exec(`INSERT INTO settings_new (id, key, value, user_id, updated_at) SELECT id, key, value, user_id, updated_at FROM settings`);
    db.exec(`DROP TABLE settings`);
    db.exec(`ALTER TABLE settings_new RENAME TO settings`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id)');
    console.log('settings 表 UNIQUE 约束已更新为 (key, user_id)');
  }

  // 检查 backups 表是否有 user_id 列
  const backupCols = db.prepare("PRAGMA table_info(backups)").all();
  if (!backupCols.find(c => c.name === 'user_id')) {
    db.exec('ALTER TABLE backups ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0');
    db.exec('CREATE INDEX IF NOT EXISTS idx_backups_user ON backups(user_id)');
    console.log('backups 表添加 user_id 列');
  }

  // 检查 AI 相关的表是否有 user_id 列
  try {
    const llmConfigCols = db.prepare("PRAGMA table_info(llm_config)").all();
    if (llmConfigCols.length > 0 && !llmConfigCols.find(c => c.name === 'user_id')) {
      db.exec('ALTER TABLE llm_config ADD COLUMN user_id INTEGER DEFAULT NULL');
      console.log('llm_config 表添加 user_id 列');
    }
  } catch (e) {
    // llm_config 表可能不存在，忽略
  }

  // 重新开启外键检查
  db.pragma('foreign_keys = ON');

  console.log('数据库迁移完成');
}

module.exports = { migration };
