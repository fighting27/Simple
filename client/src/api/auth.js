import api from './index'

// 注册
export function register(data) {
  return api.post('/auth/register', data)
}

// 登录
export function login(data) {
  return api.post('/auth/login', data)
}

// 获取当前用户信息
export function getProfile() {
  return api.get('/auth/profile')
}

// 更新用户信息
export function updateProfile(data) {
  return api.put('/auth/profile', data)
}

// 修改密码
export function changePassword(data) {
  return api.put('/auth/password', data)
}
