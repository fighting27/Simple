const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { getDbPath } = require('../utils/pathConfig');

const DB_PATH = getDbPath();

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// 启用 WAL 模式提升性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
