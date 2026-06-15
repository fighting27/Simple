const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

class TransactionService {
  // 获取交易列表
  static async getAll(userId, params) {
    return Transaction.findAll(userId, params);
  }

  // 获取交易详情
  static async getById(id) {
    const transaction = Transaction.findById(id);
    if (!transaction) {
      throw new Error('记录不存在');
    }
    return transaction;
  }

  // 创建交易
  static async create(userId, data) {
    // 验证分类是否存在
    const category = Category.findById(data.category_id);
    if (!category) {
      throw new Error('分类不存在');
    }

    // 验证分类类型是否匹配
    if (category.type !== data.type) {
      throw new Error('分类类型不匹配');
    }

    return Transaction.create(userId, data);
  }

  // 更新交易
  static async update(id, data) {
    const transaction = Transaction.findById(id);
    if (!transaction) {
      throw new Error('记录不存在');
    }

    // 如果更新了分类，验证分类是否存在
    if (data.category_id) {
      const category = Category.findById(data.category_id);
      if (!category) {
        throw new Error('分类不存在');
      }
    }

    return Transaction.update(id, data);
  }

  // 删除交易
  static async delete(id) {
    const transaction = Transaction.findById(id);
    if (!transaction) {
      throw new Error('记录不存在');
    }

    return Transaction.delete(id);
  }

  // 导入交易
  static async import(userId, transactions) {
    // 验证每条记录的分类是否存在
    for (const t of transactions) {
      const category = Category.findById(t.category_id);
      if (!category) {
        throw new Error(`分类ID ${t.category_id} 不存在`);
      }
    }

    Transaction.createMany(userId, transactions);
    return { count: transactions.length };
  }

  // 导出交易
  static async export(userId, params) {
    return Transaction.exportAll(userId, params);
  }
}

module.exports = TransactionService;
