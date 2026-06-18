const path = require('path');

function resolvePath(value, fallback) {
  if (!value) return fallback;
  return path.resolve(value);
}

function getDbPath() {
  return resolvePath(process.env.DB_PATH, path.join(__dirname, '..', '..', 'data', 'money.db'));
}

function getBackupDir() {
  return resolvePath(process.env.BACKUP_DIR, path.join(__dirname, '..', '..', 'data', 'backups'));
}

function getUploadDir() {
  return getBackupDir();
}

module.exports = {
  getDbPath,
  getBackupDir,
  getUploadDir,
};
