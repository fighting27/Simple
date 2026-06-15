# 更新日志

## 2026-06-11 登录注册系统 & 多项问题修复

### 一、新增功能：登录注册系统

#### 1. 后端架构

**数据库层**
- 新增 `users` 表，存储用户账号信息（用户名、密码哈希、昵称、头像）
- 通过 `migration.js` 为 `transactions`、`categories`、`settings`、`backups` 四张表添加 `user_id` 列，实现数据隔离
- 所有查询语句增加 `WHERE user_id = ?` 条件，确保每个用户只能访问自己的数据

**认证机制**
- 使用 `bcryptjs` 进行密码哈希（10 轮盐值），不存储明文密码
- 使用 `jsonwebtoken` 签发 JWT Token，有效期 7 天
- 请求拦截器在每个请求头自动附加 `Authorization: Bearer token`

**中间件设计**
- `server/middleware/auth.js`：JWT 验证中间件，解析 token 并注入 `req.user`
- 路由分层：`/auth/login`、`/auth/register` 放在认证中间件之前（公开路由），其余业务路由放在认证中间件之后（需要登录）

**核心文件**
```
server/models/User.js          — 用户模型（CRUD 操作）
server/utils/token.js          — JWT 签发与验证
server/services/authService.js — 注册、登录、修改密码等业务逻辑
server/controllers/authController.js — 控制器层
server/routes/authRoutes.js    — 路由定义
server/middleware/auth.js      — 认证中间件
server/database/migration.js   — 数据库迁移（添加 user_id 列）
```

#### 2. 前端架构

**状态管理**
- `client/src/stores/auth.js`（Pinia Store）：管理 token 和用户信息，token 持久化到 localStorage
- 应用启动时自动调用 `fetchProfile` 恢复用户信息，解决刷新后头像昵称丢失的问题

**路由守卫**
- `router.beforeEach` 检查 token：未登录跳转 `/login`，已登录访问 `/login` 跳转首页
- `/login` 路由标记 `requireAuth: false`，其余路由默认需要认证

**Axios 拦截器**
- 请求拦截：自动附加 token
- 响应拦截：401 状态码自动清除 token 并跳转登录页

**核心文件**
```
client/src/views/Login.vue      — 登录/注册页面（Tab 切换）
client/src/stores/auth.js       — 认证状态管理
client/src/api/auth.js          — 认证相关 API
client/src/api/index.js         — Axios 拦截器
client/src/router/index.js      — 路由守卫
```

---

### 二、数据隔离方案

#### 问题
多用户共用同一个 SQLite 数据库，需要确保每个用户的数据互不干扰。

#### 方案
为所有业务表添加 `user_id` 列，通过 SQL 查询条件隔离数据。

#### 分类表的特殊处理
`categories` 表存在两类数据：
- **默认分类**（餐饮、交通等）：`user_id = NULL, is_default = 1`，所有用户共享
- **用户自定义分类**（生活费等）：`user_id = 具体用户ID, is_default = 0`，各用户独立

#### UNIQUE 约束改造
原约束 `UNIQUE(name)` 会导致不同用户无法创建同名自定义分类。通过 migration 重建表，将约束改为 `UNIQUE(name, user_id)`，允许每个用户拥有独立的分类体系。

同样的处理应用于 `settings` 表：`UNIQUE(key)` → `UNIQUE(key, user_id)`。

#### 外键约束问题
`connection.js` 中启用了 `PRAGMA foreign_keys = ON`。重建表时需要临时关闭外键检查，否则 `DROP TABLE categories` 会因 `transactions` 表的外键引用而失败。

```javascript
// migration.js
db.pragma('foreign_keys = OFF');
// ... 重建表操作 ...
db.pragma('foreign_keys = ON');
```

---

### 三、JSON 导入导出修复

#### 问题 1：UNIQUE 约束冲突
导入 JSON 时，尝试插入已存在的默认分类导致 `UNIQUE constraint failed`。

#### 解决
- 使用 `INSERT OR IGNORE` 跳过已存在的分类
- 导入时只插入用户自定义分类（`is_default = 0`），默认分类已全局存在，不重复创建

#### 问题 2：category_id 错位
用户自定义分类删除后重新插入会得到新的自增 ID，导致交易记录的 `category_id` 指向错误的分类。

#### 解决
通过 `category_name` 字段重新映射 `category_id`：
```javascript
const categoryId = categoryNameToId[t.category_name];
if (!categoryId) continue; // 找不到分类则跳过该交易
```

#### 问题 3：部分数据导入失败
开启外键约束后，如果某条交易的 `category_id` 在分类表中不存在，INSERT 会失败，后续记录全部跳过。

#### 解决
- 整个导入操作用 `db.transaction()` 包裹，失败时全部回滚
- 通过分类名而非分类 ID 关联，确保引用有效

---

### 四、其他修复

#### 1. 修改密码后跳转登录页
修改密码成功后自动清除 token 并跳转到登录页面，要求重新登录。

#### 2. 错误弹窗重复显示
**原因**：Axios 拦截器已经 `ElMessage.error()` 弹窗一次，业务层 catch 中又弹窗一次。

**解决**：拦截器弹窗后标记 `error._handled = true`，业务层检查该标记避免重复：
```javascript
// api/index.js
error._handled = true
return Promise.reject(error)

// Login.vue / Settings.vue
catch (e) {
  if (!e._handled) errorMsg.value = e.message || '操作失败'
}
```

#### 3. 刷新后用户信息丢失
**原因**：auth store 初始化时只恢复了 token，没有恢复 user 对象。

**解决**：在 `App.vue` 的 `loadUserData` 中增加 `authStore.fetchProfile()` 调用，启动时从后端获取用户信息。

---

### 五、涉及的技术栈

| 用途 | 技术 |
|------|------|
| 密码加密 | bcryptjs（10 轮盐值哈希） |
| 身份认证 | jsonwebtoken（JWT, 7 天有效期） |
| 数据库迁移 | PRAGMA table_info 检测列是否存在，条件执行 ALTER TABLE |
| 表结构改造 | CREATE TABLE → INSERT → DROP → RENAME（SQLite 不支持 ALTER CONSTRAINT） |
| 导入事务 | db.transaction() 包裹，保证原子性 |
| 分类映射 | 通过 category_name 重新关联 category_id，避免 ID 错位 |
| 错误去重 | error._handled 标记位，拦截器与业务层协同 |
