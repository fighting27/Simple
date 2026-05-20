# 更新
2026-5-20
修复图表分析界面的功能bug

# 简易个人记账本

本地运行的个人记账工具，零门槛、数据永久保存、无需联网。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus + ECharts + @vueuse/motion |
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| 样式 | SCSS + CSS Custom Properties |

## 快速开始

```bash
# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd client && npm install

# 启动后端（端口 3000）
cd server && npm start

# 启动前端（端口 5173）
cd client && npm run dev
```

浏览器访问 http://localhost:5173

## 功能

- **仪表盘** - 今日/本月收支、当前结余、趋势图、分类饼图、最近记录
- **收支记录** - 增删改查、按类型/分类/日期/关键词筛选、分页
- **分类管理** - 默认 8 个分类（餐饮、交通、购物、房租、娱乐、工资、红包、理财），支持自定义
- **图表分析** - 月度趋势折线图、分类占比饼图、年度柱状图
- **数据管理** - Excel 导入导出、JSON 备份恢复、本地快照
- **设置** - 昵称、月预算、超支提醒

## 设计系统

采用高端 SaaS 质感设计，基于 design-taste-frontend skill：

- **字体** - Outfit（正文）+ JetBrains Mono（数字）
- **主色** - 薄荷绿 `#10B981`，冷灰色调背景
- **圆角** - 20px / 14px / 10px 三级圆角
- **阴影** - 扩散阴影 `0 20px 40px -15px rgba(15,23,42,0.04)`
- **动效** - 弹性过渡曲线 `cubic-bezier(0.16, 1, 0.3, 1)`
- **布局** - 不对称 Bento Grid，毛玻璃侧边栏
- **粒子** - Canvas 粒子背景叠加层

## 项目结构

```
money-sys/
├── client/
│   ├── src/
│   │   ├── api/            # Axios 接口层
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── router/         # 路由配置
│   │   ├── views/          # 6 个页面
│   │   ├── components/     # 公共组件
│   │   ├── layout/         # 布局（Sidebar + MainLayout）
│   │   ├── utils/          # 格式化工具
│   │   └── styles/         # 设计系统（variables / reset / global）
│   └── vite.config.js
├── server/
│   ├── controllers/        # 控制器
│   ├── services/           # 业务逻辑
│   ├── models/             # 数据模型
│   ├── routes/             # 路由
│   ├── database/           # SQLite 初始化 + 种子数据
│   └── app.js              # Express 入口
└── README.md
```

## API

所有接口前缀：`/api/v1`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /transactions | 收支列表（支持筛选分页） |
| POST | /transactions | 新增记录 |
| PUT | /transactions/:id | 编辑记录 |
| DELETE | /transactions/:id | 删除记录 |
| GET | /categories | 分类列表 |
| POST | /categories | 新增分类 |
| PUT | /categories/:id | 编辑分类 |
| DELETE | /categories/:id | 删除分类 |
| GET | /statistics/overview | 总览统计 |
| GET | /statistics/today | 今日统计 |
| GET | /statistics/week | 本周统计 |
| GET | /statistics/month | 本月统计 |
| GET | /statistics/trend | 月度趋势 |
| GET | /statistics/category | 分类占比 |
| GET | /statistics/yearly | 年度统计 |
| GET | /backup/export/excel | 导出 Excel |
| POST | /backup/import/excel | 导入 Excel |
| POST | /backup/create | 创建备份 |
| GET | /backup/list | 备份列表 |
| POST | /backup/restore/:id | 恢复备份 |
| GET | /backup/export/json | 导出 JSON |
| POST | /backup/import/json | 导入 JSON |
| GET | /settings | 获取设置 |
| PUT | /settings | 更新设置 |

## 数据库

SQLite 文件位于 `server/data/money.db`，首次运行自动创建。

| 表 | 说明 |
|------|------|
| transactions | 收支记录 |
| categories | 分类（默认 8 个） |
| settings | 用户设置 |
| backups | 备份记录 |
