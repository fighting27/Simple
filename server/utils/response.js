/**
 * 统一响应格式工具
 */

function success(data = null, message = 'success') {
  return {
    code: 200,
    message,
    data,
  };
}

function error(message = 'error', code = 500, data = null) {
  return {
    code,
    message,
    data,
  };
}

function paginated(data, total, page, pageSize) {
  return {
    code: 200,
    message: 'success',
    data: {
      list: data,
      pagination: {
        total,
        page: parseInt(page),
        page_size: parseInt(pageSize),
        total_pages: Math.ceil(total / pageSize),
      },
    },
  };
}

module.exports = { success, error, paginated };
