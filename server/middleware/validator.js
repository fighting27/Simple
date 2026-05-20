const { error } = require('../utils/response');

function validateTransaction(req, res, next) {
  const { type, amount, category_id, transaction_date } = req.body;

  if (!type || !['income', 'expense'].includes(type)) {
    return res.status(400).json(error('类型必须是 income 或 expense', 400));
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json(error('金额必须大于0', 400));
  }

  if (!category_id) {
    return res.status(400).json(error('分类不能为空', 400));
  }

  if (!transaction_date) {
    return res.status(400).json(error('日期不能为空', 400));
  }

  next();
}

function validateCategory(req, res, next) {
  const { name, type } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json(error('分类名称不能为空', 400));
  }

  if (!type || !['income', 'expense'].includes(type)) {
    return res.status(400).json(error('类型必须是 income 或 expense', 400));
  }

  next();
}

module.exports = { validateTransaction, validateCategory };
