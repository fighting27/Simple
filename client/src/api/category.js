import api from './index'

// 获取所有分类
export function getCategories(type) {
  return api.get('/categories', { params: { type } })
}

// 获取分类详情
export function getCategory(id) {
  return api.get(`/categories/${id}`)
}

// 创建分类
export function createCategory(data) {
  return api.post('/categories', data)
}

// 更新分类
export function updateCategory(id, data) {
  return api.put(`/categories/${id}`, data)
}

export function reorderCategories(data) {
  return api.patch('/categories/reorder', data)
}

// 删除分类
export function deleteCategory(id) {
  return api.delete(`/categories/${id}`)
}
