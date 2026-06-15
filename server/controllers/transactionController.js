const TransactionService = require('../services/transactionService');
const { success, error, paginated } = require('../utils/response');

class TransactionController {
  // 获取交易列表
  static async getAll(req, res) {
    try {
      const { type, category_id, start_date, end_date, keyword, page = 1, page_size = 20 } = req.query;
      const result = await TransactionService.getAll(req.user.id, {
        type,
        category_id: category_id ? parseInt(category_id) : null,
        start_date,
        end_date,
        keyword,
        page: parseInt(page),
        page_size: parseInt(page_size),
      });
      res.json(paginated(result.list, result.total, page, page_size));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 获取交易详情
  static async getById(req, res) {
    try {
      const transaction = await TransactionService.getById(parseInt(req.params.id));
      res.json(success(transaction));
    } catch (err) {
      const statusCode = err.message === '记录不存在' ? 404 : 500;
      res.status(statusCode).json(error(err.message, statusCode));
    }
  }

  // 创建交易
  static async create(req, res) {
    try {
      const transaction = await TransactionService.create(req.user.id, req.body);
      res.status(201).json(success(transaction, '创建成功'));
    } catch (err) {
      const statusCode = err.message.includes('不存在') ? 400 : 500;
      res.status(statusCode).json(error(err.message, statusCode));
    }
  }

  // 更新交易
  static async update(req, res) {
    try {
      const transaction = await TransactionService.update(parseInt(req.params.id), req.body);
      res.json(success(transaction, '更新成功'));
    } catch (err) {
      const statusCode = err.message === '记录不存在' ? 404 : 400;
      res.status(statusCode).json(error(err.message, statusCode));
    }
  }

  // 删除交易
  static async delete(req, res) {
    try {
      await TransactionService.delete(parseInt(req.params.id));
      res.json(success(null, '删除成功'));
    } catch (err) {
      const statusCode = err.message === '记录不存在' ? 404 : 500;
      res.status(statusCode).json(error(err.message, statusCode));
    }
  }
}

module.exports = TransactionController;
