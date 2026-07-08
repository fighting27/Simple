const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { validateCategory } = require('../middleware/validator');

// GET /api/v1/categories - 获取所有分类
router.get('/', CategoryController.getAll);

// GET /api/v1/categories/:id - 获取分类详情
router.get('/:id', CategoryController.getById);

// POST /api/v1/categories - 创建分类
router.post('/', validateCategory, CategoryController.create);

// PATCH /api/v1/categories/reorder - 更新分类排序
router.patch('/reorder', CategoryController.reorder);

// PUT /api/v1/categories/:id - 更新分类
router.put('/:id', CategoryController.update);

// DELETE /api/v1/categories/:id - 删除分类
router.delete('/:id', CategoryController.delete);

module.exports = router;
