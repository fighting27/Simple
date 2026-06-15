const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { sign } = require('../utils/token');

const SALT_ROUNDS = 10;

class AuthService {
  static async register({ username, password, nickname = '' }) {
    const existing = User.findByUsername(username);
    if (existing) {
      throw new Error('用户名已存在');
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = User.create({ username, password_hash, nickname: nickname || username });

    // 同步昵称到设置表
    Setting.update(user.id, 'nickname', user.nickname);

    const token = sign({ id: user.id, username: user.username });

    return {
      token,
      user: { id: user.id, username: user.username, nickname: user.nickname },
    };
  }

  static async login({ username, password }) {
    const user = User.findByUsername(username);
    if (!user) {
      throw new Error('用户名或密码错误');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error('用户名或密码错误');
    }

    const token = sign({ id: user.id, username: user.username });

    return {
      token,
      user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar },
    };
  }

  static getProfile(userId) {
    const user = User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  }

  static updateProfile(userId, data) {
    User.updateProfile(userId, data);
    return User.findById(userId);
  }

  static async changePassword(userId, { oldPassword, newPassword }) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const valid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!valid) {
      throw new Error('原密码错误');
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    User.updatePassword(userId, password_hash);
  }
}

// 需要在 changePassword 中引用 db
const db = require('../database/connection');

module.exports = AuthService;
