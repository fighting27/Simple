const { error } = require('../utils/response');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('请求错误', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json(error(message, statusCode));
}

function notFoundHandler(req, res) {
  res.status(404).json(error('接口不存在', 404));
}

module.exports = { errorHandler, notFoundHandler };
