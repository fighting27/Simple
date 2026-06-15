const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/auth');

// 公开接口
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// 需要认证的接口
router.get('/profile', auth, AuthController.getProfile);
router.put('/profile', auth, AuthController.updateProfile);
router.put('/password', auth, AuthController.changePassword);

module.exports = router;
