const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'money-sys-secret-key-2024';
const EXPIRES_IN = '7d';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { sign, verify };
