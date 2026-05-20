import api from './index'

// 获取总览统计
export function getOverview() {
  return api.get('/statistics/overview')
}

// 获取今日统计
export function getTodayStats() {
  return api.get('/statistics/today')
}

// 获取本周统计
export function getWeekStats() {
  return api.get('/statistics/week')
}

// 获取本月统计
export function getMonthStats() {
  return api.get('/statistics/month')
}

// 获取月度趋势
export function getTrend(year) {
  return api.get('/statistics/trend', { params: { year } })
}

// 获取分类占比
export function getCategoryStats(params) {
  return api.get('/statistics/category', { params })
}

// 获取年度统计
export function getYearlyStats(year) {
  return api.get('/statistics/yearly', { params: { year } })
}
