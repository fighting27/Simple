const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const BackupController = require('../controllers/backupController');
const { getUploadDir } = require('../utils/pathConfig');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `upload_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      const err = new Error('只支持 Excel 和 JSON 文件');
      err.statusCode = 400;
      cb(err);
    }
  },
});

// GET /api/v1/backup/export/excel - 导出 Excel
router.get('/export/excel', BackupController.exportExcel);

// POST /api/v1/backup/import/excel - 导入 Excel
router.post('/import/excel', upload.single('file'), BackupController.importExcel);

// POST /api/v1/backup/create - 创建备份
router.post('/create', BackupController.createBackup);

// GET /api/v1/backup/list - 备份列表
router.get('/list', BackupController.getList);

// POST /api/v1/backup/restore/:id - 恢复备份
router.post('/restore/:id', BackupController.restoreBackup);

// GET /api/v1/backup/export/json - 导出 JSON
router.get('/export/json', BackupController.exportJson);

// POST /api/v1/backup/import/json - 导入 JSON
router.post('/import/json', upload.single('file'), BackupController.importJson);

module.exports = router;
