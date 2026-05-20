const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { validateTransaction } = require('../middleware/validator');

// GET /api/v1/transactions - 获取交易列表
router.get('/', TransactionController.getAll);

// GET /api/v1/transactions/:id - 获取交易详情
router.get('/:id', TransactionController.getById);

// POST /api/v1/transactions - 创建交易
router.post('/', validateTransaction, TransactionController.create);

// PUT /api/v1/transactions/:id - 更新交易
router.put('/:id', validateTransaction, TransactionController.update);

// DELETE /api/v1/transactions/:id - 删除交易
router.delete('/:id', TransactionController.delete);

module.exports = router;
