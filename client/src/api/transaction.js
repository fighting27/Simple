import api from './index'

// 获取交易列表
export function getTransactions(params) {
  return api.get('/transactions', { params })
}

// 获取交易详情
export function getTransaction(id) {
  return api.get(`/transactions/${id}`)
}

// 创建交易
export function createTransaction(data) {
  return api.post('/transactions', data)
}

// 更新交易
export function updateTransaction(id, data) {
  return api.put(`/transactions/${id}`, data)
}

// 删除交易
export function deleteTransaction(id) {
  return api.delete(`/transactions/${id}`)
}
