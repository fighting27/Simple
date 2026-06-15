const BackupService = require('../services/backupService');
const { success, error } = require('../utils/response');
const path = require('path');

class BackupController {
  // 导出 Excel
  static async exportExcel(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const { filepath, filename } = await BackupService.exportExcel(req.user.id, { start_date, end_date });
      res.download(filepath, filename);
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 导入 Excel
  static async importExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(error('请上传文件', 400));
      }

      const result = await BackupService.importExcel(req.user.id, req.file.path);
      res.json(success(result, `成功导入 ${result.count} 条记录`));
    } catch (err) {
      res.status(400).json(error(err.message, 400));
    }
  }

  // 创建备份
  static async createBackup(req, res) {
    try {
      const backup = await BackupService.createBackup(req.user.id);
      res.json(success(backup, '备份创建成功'));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 获取备份列表
  static async getList(req, res) {
    try {
      const list = await BackupService.getList(req.user.id);
      res.json(success(list));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 恢复备份
  static async restoreBackup(req, res) {
    try {
      const result = await BackupService.restoreBackup(req.user.id, parseInt(req.params.id));
      res.json(success(result, '备份恢复成功'));
    } catch (err) {
      res.status(400).json(error(err.message, 400));
    }
  }

  // 导出 JSON
  static async exportJson(req, res) {
    try {
      const data = await BackupService.exportJson(req.user.id);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=backup.json');
      res.json(data);
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 导入 JSON
  static async importJson(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(error('请上传文件', 400));
      }

      const fs = require('fs');
      const content = fs.readFileSync(req.file.path, 'utf-8');
      const data = JSON.parse(content);
      const result = await BackupService.importJson(req.user.id, data);
      res.json(success(result, '数据恢复成功'));
    } catch (err) {
      res.status(400).json(error(err.message, 400));
    }
  }
}

module.exports = BackupController;
