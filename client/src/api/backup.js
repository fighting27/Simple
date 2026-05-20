import api from './index'

// 导出 Excel
export function exportExcel(params) {
  return api.get('/backup/export/excel', {
    params,
    responseType: 'blob',
  })
}

// 导入 Excel
export function importExcel(file) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/backup/import/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 创建备份
export function createBackup() {
  return api.post('/backup/create')
}

// 获取备份列表
export function getBackupList() {
  return api.get('/backup/list')
}

// 恢复备份
export function restoreBackup(id) {
  return api.post(`/backup/restore/${id}`)
}

// 导出 JSON
export function exportJson() {
  return api.get('/backup/export/json', { responseType: 'blob' })
}

// 导入 JSON
export function importJson(file) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/backup/import/json', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
