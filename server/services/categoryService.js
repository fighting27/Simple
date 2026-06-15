const Category = require('../models/Category');

class CategoryService {
  // 获取所有分类
  static async getAll(userId, type) {
    return Category.findAll(userId, type);
  }

  // 获取分类详情
  static async getById(id) {
    const category = Category.findById(id);
    if (!category) {
      throw new Error('分类不存在');
    }
    return category;
  }

  // 创建分类
  static async create(userId, data) {
    // 检查名称是否重复
    if (Category.existsByName(userId, data.name)) {
      throw new Error('分类名称已存在');
    }
    return Category.create(userId, data);
  }

  // 更新分类
  static async update(userId, id, data) {
    const category = Category.findById(id);
    if (!category) {
      throw new Error('分类不存在');
    }

    // 检查名称是否重复
    if (data.name && Category.existsByName(userId, data.name, id)) {
      throw new Error('分类名称已存在');
    }

    return Category.update(id, data);
  }

  // 删除分类
  static async delete(id) {
    const category = Category.findById(id);
    if (!category) {
      throw new Error('分类不存在');
    }

    return Category.delete(id);
  }
}

module.exports = CategoryService;
