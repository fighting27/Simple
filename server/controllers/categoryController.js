const CategoryService = require('../services/categoryService');
const { success, error } = require('../utils/response');

class CategoryController {
  // 获取所有分类
  static async getAll(req, res) {
    try {
      const { type } = req.query;
      const categories = await CategoryService.getAll(req.user.id, type);
      res.json(success(categories));
    } catch (err) {
      res.status(500).json(error(err.message));
    }
  }

  // 获取分类详情
  static async getById(req, res) {
    try {
      const category = await CategoryService.getById(parseInt(req.params.id));
      res.json(success(category));
    } catch (err) {
      const statusCode = err.message === '分类不存在' ? 404 : 500;
      res.status(statusCode).json(error(err.message, statusCode));
    }
  }

  // 创建分类
  static async create(req, res) {
    try {
      const category = await CategoryService.create(req.user.id, req.body);
      res.status(201).json(success(category, '创建成功'));
    } catch (err) {
      const statusCode = err.message.includes('已存在') ? 400 : 500;
      res.status(statusCode).json(error(err.message, statusCode));
    }
  }

  // 更新分类
  static async update(req, res) {
    try {
      const category = await CategoryService.update(req.user.id, parseInt(req.params.id), req.body);
      res.json(success(category, '更新成功'));
    } catch (err) {
      const statusCode = err.message === '分类不存在' ? 404 : 400;
      res.status(statusCode).json(error(err.message, statusCode));
    }
  }

  static async reorder(req, res) {
    try {
      const categories = await CategoryService.reorder(req.user.id, req.body);
      res.json(success(categories, '排序已更新'));
    } catch (err) {
      res.status(400).json(error(err.message, 400));
    }
  }

  // 删除分类
  static async delete(req, res) {
    try {
      await CategoryService.delete(parseInt(req.params.id));
      res.json(success(null, '删除成功'));
    } catch (err) {
      const statusCode = err.message === '分类不存在' ? 404 : 400;
      res.status(statusCode).json(error(err.message, statusCode));
    }
  }
}

module.exports = CategoryController;
