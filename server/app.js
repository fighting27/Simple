const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/init');
const { seedDatabase } = require('./database/seed');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件（前端构建产物）
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// API 路由
app.use('/api/v1', routes);

// 前端路由回退（SPA 支持）
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 初始化数据库并启动服务器
function startServer() {
  try {
    // 初始化数据库表
    initDatabase();

    // 插入默认数据
    seedDatabase();

    // 更新数据路径设置
    const db = require('./database/connection');
    const dbPath = path.join(__dirname, 'data', 'money.db');
    db.prepare("UPDATE settings SET value = ? WHERE key = 'data_path'").run(dbPath);

    app.listen(PORT, () => {
      logger.info(`服务器启动成功`);
      logger.info(`地址: http://localhost:${PORT}`);
      logger.info(`API: http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    logger.error('服务器启动失败', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
