const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'money-sys-category-reorder-'));
process.env.DB_PATH = path.join(testDir, 'money.db');

const db = require('./database/connection');
const { initDatabase } = require('./database/init');
const { migration } = require('./database/migration');
const Category = require('./models/Category');

try {
  initDatabase();
  migration();

  const insert = db.prepare(`
    INSERT INTO categories (name, type, icon, sort_order, is_default, user_id)
    VALUES (?, ?, '', ?, ?, ?)
  `);

  const defaultFoodId = insert.run('Food', 'expense', 10, 1, null).lastInsertRowid;
  const customAId = insert.run('User A', 'expense', 20, 0, 7).lastInsertRowid;
  const customBId = insert.run('User B', 'expense', 30, 0, 7).lastInsertRowid;
  insert.run('Other User', 'expense', 40, 0, 99);
  insert.run('Salary', 'income', 50, 1, null);

  Category.reorder(7, 'expense', [customBId, defaultFoodId, customAId]);

  const orderedNames = Category.findAll(7, 'expense').map(category => category.name);
  assert.deepStrictEqual(orderedNames, ['User B', 'Food', 'User A']);

  const otherUserNames = Category.findAll(99, 'expense').map(category => category.name);
  assert.deepStrictEqual(otherUserNames, ['Food', 'Other User']);

  console.log('category reorder tests passed');
} finally {
  db.close();
  fs.rmSync(testDir, { recursive: true, force: true });
}
