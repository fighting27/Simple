# SQLite 部署数据保护说明

本项目默认使用 SQLite。生产环境不要把数据库文件放在随代码一起覆盖的 `server/` 目录里，否则重新上传 zip 并解压时可能覆盖线上数据。

## 生产环境变量

推荐在服务器启动服务时配置：

```bash
DB_PATH=/www/data/money-sys/money.db
BACKUP_DIR=/www/data/money-sys/backups
```

如果没有配置，程序会回退到旧路径：

```text
server/data/money.db
server/backups
```

## 打包时必须排除

压缩上传 `server` 时不要包含：

```text
server/data/
server/backups/
server/node_modules/
server/data/money.db
server/data/money.db-wal
server/data/money.db-shm
```

`node_modules` 可以在服务器通过 `npm install` 或 `npm ci` 重新安装。

## 推荐部署流程

1. 停止 Node 服务。
2. 备份线上 SQLite 文件和备份目录。
3. 上传只包含代码的 zip。
4. 解压时不要覆盖生产数据目录，例如 `/www/data/money-sys`。
5. 在服务器执行 `npm install` 或 `npm ci`。
6. 确认启动环境变量包含 `DB_PATH` 和 `BACKUP_DIR`。
7. 启动服务。

## SQLite WAL 注意事项

项目开启了 WAL 模式，数据库可能同时包含：

```text
money.db
money.db-wal
money.db-shm
```

迁移或备份数据库文件时，最稳妥的做法是先停止服务再复制这些文件，或者先执行 SQLite checkpoint。

## 如果数据已经被覆盖

先停止服务，避免继续写入新库。然后在服务器搜索这些文件：

```text
money.db
money.db-wal
backup_*.json
*.xlsx
```

如果找到旧的 JSON 备份，可以通过系统的 JSON 导入/恢复功能恢复。如果找到旧的 `money.db`，停止服务后把它放到当前 `DB_PATH` 指向的位置再启动服务。
