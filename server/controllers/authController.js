const AuthService = require('../services/authService');

class AuthController {
  static async register(req, res, next) {
    try {
      const { username, password, nickname } = req.body;

      if (!username || !password) {
        return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ code: 400, message: '用户名长度 3-20 个字符' });
      }

      if (password.length < 6) {
        return res.status(400).json({ code: 400, message: '密码至少 6 个字符' });
      }

      const result = await AuthService.register({ username, password, nickname });
      res.json({ code: 200, data: result });
    } catch (err) {
      res.status(400).json({ code: 400, message: err.message });
    }
  }

  static async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
      }

      const result = await AuthService.login({ username, password });
      res.json({ code: 200, data: result });
    } catch (err) {
      res.status(400).json({ code: 400, message: err.message });
    }
  }

  static getProfile(req, res, next) {
    try {
      const user = AuthService.getProfile(req.user.id);
      res.json({ code: 200, data: user });
    } catch (err) {
      res.status(400).json({ code: 400, message: err.message });
    }
  }

  static updateProfile(req, res, next) {
    try {
      const { nickname, avatar } = req.body;
      const user = AuthService.updateProfile(req.user.id, { nickname, avatar });
      res.json({ code: 200, data: user });
    } catch (err) {
      res.status(400).json({ code: 400, message: err.message });
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ code: 400, message: '请输入原密码和新密码' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ code: 400, message: '新密码至少 6 个字符' });
      }

      await AuthService.changePassword(req.user.id, { oldPassword, newPassword });
      res.json({ code: 200, message: '密码修改成功' });
    } catch (err) {
      res.status(400).json({ code: 400, message: err.message });
    }
  }
}

module.exports = AuthController;
