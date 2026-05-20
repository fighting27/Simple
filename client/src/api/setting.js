import api from './index'

// 获取所有设置
export function getSettings() {
  return api.get('/settings')
}

// 更新设置
export function updateSettings(data) {
  return api.put('/settings', data)
}

// 检查预算
export function checkBudget() {
  return api.get('/settings/budget')
}
