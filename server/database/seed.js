const db = require('./connection');

function seedDatabase() {
  // 检查是否已有数据
  const count = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (count.count > 0) {
    console.log('数据库已有数据，跳过初始化');
    return;
  }

  // 插入默认支出分类
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, type, icon, sort_order, is_default) VALUES (?, ?, ?, ?, 1)
  `);

  const expenseCategories = [
    ['餐饮', 'expense', 'Dish', 1],
    ['交通', 'expense', 'Van', 2],
    ['购物', 'expense', 'ShoppingBag', 3],
    ['房租', 'expense', 'House', 4],
    ['娱乐', 'expense', 'Film', 5],
  ];

  const incomeCategories = [
    ['工资', 'income', 'Money', 6],
    ['红包', 'income', 'Present', 7],
    ['理财', 'income', 'TrendCharts', 8],
  ];

  const insertMany = db.transaction((categories) => {
    for (const cat of categories) {
      insertCategory.run(...cat);
    }
  });

  insertMany(expenseCategories);
  insertMany(incomeCategories);

  // 插入默认设置
  const insertSetting = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
  `);

  const defaultSettings = [
    ['nickname', '用户'],
    ['monthly_budget', '5000'],
    ['budget_alert', '1'],
    ['data_path', ''],
  ];

  const insertSettings = db.transaction((settings) => {
    for (const [key, value] of settings) {
      insertSetting.run(key, value);
    }
  });

  insertSettings(defaultSettings);

  console.log('默认数据插入完成');
}

module.exports = { seedDatabase };
