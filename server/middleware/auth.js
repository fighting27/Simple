const { verify } = require('../utils/token');

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录或 token 无效' });
  }

  const token = header.slice(7);

  try {
    const decoded = verify(token);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'token 已过期，请重新登录' });
  }
}

module.exports = auth;
