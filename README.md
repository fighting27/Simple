# 更新
## 2026-7-8
- 分类管理部分优化

## 2026-6-18
- llm响应时间的优化，避免超时

## 2026-6-17
- 添加AI对话助手
- 大模型深度分析prompt进行优化

## 2026-6-13
- 登录注册系统 & 多项问题修复
- 优化PWA支持，支持多人使用互不干扰

## 2026-6-11
- 通过 CSS 媒体查询（@media max-width: 768px）配合 Vue 响应式状态，实现侧边栏抽屉式布局和主内容区自适应
适配移动端操作体验

## 2026-5-28
- 新增PWA功能，支持手机端桌面访问
- 部署到服务器上，支持在线访问

## 2026-5-27
- 新增 Python AI 智能分析服务（环比对比/异常检测/月末预测/分类洞察）
- API 前缀 `/api/v1/ai/`，需要先启动 Python 服务 (端口 5001)

## 2026-5-21
- 5个页面统一动画清理，根元素改用全局 `.stagger-item` 类（瀑布式入场动画）
- 新增动画和工具类

## 2026-5-20
- 修复图表分析界面的功能bug

# 简易个人记账本

本地运行的个人记账工具，支持多人使用、AI 智能分析、PWA 离线访问。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus + ECharts + Pinia |
| 后端 | Node.js + Express + better-sqlite3 |
| AI 分析 | Python + Flask + NumPy + SciPy |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 样式 | SCSS + CSS Custom Properties + @vueuse/motion |

## 快速开始

```bash
# 1. 后端（端口 3000）
cd server && npm install && npm start

# 2. AI 服务（端口 5001，可选）
cd python-ai
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python app.py

# 3. 前端（端口 5173）
cd client && npm install && npm run dev
```

浏览器访问 http://localhost:5173，首次使用需注册账号。

## 功能

- **登录注册** — 多用户支持，JWT 认证，数据隔离
- **仪表盘** — 今日/本月收支、当前结余、趋势图、分类饼图、最近记录
- **收支记录** — 增删改查、按类型/分类/日期/关键词筛选、分页
- **分类管理** — 默认 8 个分类（餐饮、交通、购物、房租、娱乐、工资、红包、理财），支持自定义
- **图表分析** — 月度趋势折线图、分类占比饼图、年度柱状图
- **AI 分析** — 环比对比、异常检测、月末预测、分类洞察、LLM 深度分析、AI 对话问答
- **数据管理** — Excel 导入导出、JSON 备份恢复、本地快照
- **设置** — 昵称、月预算、超支提醒、LLM API 配置

## 项目结构

```
money-sys/
├── client/                 # Vue 3 前端
│   └── src/
│       ├── api/            # Axios 接口层
│       ├── stores/         # Pinia 状态管理
│       ├── views/          # 8 个页面（含登录、AI 分析）
│       ├── components/     # 公共组件（图表、表单、粒子背景）
│       ├── layout/         # Sidebar + MainLayout
│       └── styles/         # SCSS 设计系统
├── server/                 # Node.js 后端
│   ├── controllers/        # 控制器
│   ├── services/           # 业务逻辑
│   ├── models/             # 数据模型（better-sqlite3）
│   ├── routes/             # 路由（含 AI 代理转发）
│   ├── middleware/          # auth.js (JWT) + errorHandler + validator
│   ├── database/           # SQLite 初始化 + 迁移 + 种子数据
│   └── app.js              # Express 入口
├── python-ai/              # Python AI 分析服务
│   ├── app.py              # Flask API
│   ├── analyzer.py         # 分析引擎（环比/异常/预测/洞察）
│   ├── llm_client.py       # LLM API 调用
│   └── db_reader.py        # 直接读取 SQLite
└── data/                   # SQLite 数据库文件
```

## API

所有接口前缀：`/api/v1`，需 Bearer Token 认证（`/api/v1/auth` 除外）。

| 模块 | 接口 | 说明 |
|------|------|------|
| 认证 | POST /auth/register | 注册 |
| | POST /auth/login | 登录 |
| 收支 | GET/POST/PUT/DELETE | /transactions |
| 分类 | GET/POST/PUT/DELETE | /categories |
| 统计 | GET | /statistics/overview, /today, /week, /month, /trend, /category, /yearly |
| 备份 | GET/POST | /backup/export, /import, /create, /restore |
| 设置 | GET/PUT | /settings |
| AI | GET | /ai/summary, /comparison, /anomalies, /prediction, /insights |
| | GET | /ai/llm-summary（LLM 深度分析） |
| | POST | /ai/chat（AI 对话问答） |
| | GET/POST | /ai/config（LLM 配置管理） |

## 数据库

SQLite 文件位于 `data/money.db`，首次运行自动创建。

| 表 | 说明 |
|------|------|
| users | 用户账号 |
| transactions | 收支记录 |
| categories | 分类（默认 8 个） |
| settings | 用户设置 |
| backups | 备份记录 |

## 设计

高端 SaaS 质感设计系统：

- **字体** — Outfit（正文）+ JetBrains Mono（数字）
- **主色** — 薄荷绿 `#10B981`，冷灰色调背景
- **圆角** — 20px / 14px / 10px 三级
- **阴影** — 扩散阴影 `0 20px 40px -15px rgba(15,23,42,0.04)`
- **动效** — 弹性过渡曲线 `cubic-bezier(0.16, 1, 0.3, 1)`，@vueuse/motion
- **布局** — 不对称 Bento Grid，毛玻璃侧边栏
- **背景** — Canvas 粒子叠加层
- **适配** — CSS 媒体查询实现移动端抽屉式布局

## 环境变量

AI 服务配置（`python-ai/.env.local`，勿提交）：

```env
AI_API_KEY=your_api_key
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
AI_ENABLED=true
```


