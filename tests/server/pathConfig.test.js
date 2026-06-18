const assert = require('assert');
const os = require('os');
const path = require('path');

const pathConfig = require('../../server/utils/pathConfig');

const originalDbPath = process.env.DB_PATH;
const originalBackupDir = process.env.BACKUP_DIR;

function resetEnv() {
  if (originalDbPath === undefined) {
    delete process.env.DB_PATH;
  } else {
    process.env.DB_PATH = originalDbPath;
  }

  if (originalBackupDir === undefined) {
    delete process.env.BACKUP_DIR;
  } else {
    process.env.BACKUP_DIR = originalBackupDir;
  }
}

try {
  const customDbPath = path.join(os.tmpdir(), 'money-sys-test', 'money.db');
  const customBackupDir = path.join(os.tmpdir(), 'money-sys-test', 'backups');

  process.env.DB_PATH = customDbPath;
  process.env.BACKUP_DIR = customBackupDir;

  assert.strictEqual(pathConfig.getDbPath(), customDbPath);
  assert.strictEqual(pathConfig.getBackupDir(), customBackupDir);
  assert.strictEqual(pathConfig.getUploadDir(), customBackupDir);

  delete process.env.DB_PATH;
  delete process.env.BACKUP_DIR;

  assert.strictEqual(pathConfig.getDbPath(), path.join(__dirname, '..', '..', 'data', 'money.db'));
  assert.strictEqual(pathConfig.getBackupDir(), path.join(__dirname, '..', '..', 'data', 'backups'));
  assert.strictEqual(pathConfig.getUploadDir(), path.join(__dirname, '..', '..', 'data', 'backups'));

  console.log('pathConfig tests passed');
} finally {
  resetEnv();
}
