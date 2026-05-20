import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getOverview, getTodayStats, getWeekStats, getMonthStats, getTrend, getCategoryStats, getYearlyStats } from '@/api/statistics'

export const useStatisticsStore = defineStore('statistics', () => {
  const overview = ref({ total_income: 0, total_expense: 0, balance: 0 })
  const today = ref({})
  const week = ref({})
  const month = ref({})
  const trend = ref([])
  const categoryStats = ref([])
  const yearly = ref({})
  const loading = ref(false)

  // 获取总览统计
  async function fetchOverview() {
    const res = await getOverview()
    overview.value = res.data
  }

  // 获取今日统计
  async function fetchToday() {
    const res = await getTodayStats()
    today.value = res.data
  }

  // 获取本周统计
  async function fetchWeek() {
    const res = await getWeekStats()
    week.value = res.data
  }

  // 获取本月统计
  async function fetchMonth() {
    const res = await getMonthStats()
    month.value = res.data
  }

  // 获取月度趋势
  async function fetchTrend(year) {
    const res = await getTrend(year)
    trend.value = res.data
  }

  // 获取分类占比
  async function fetchCategoryStats(params) {
    const res = await getCategoryStats(params)
    categoryStats.value = res.data
  }

  // 获取年度统计
  async function fetchYearly(year) {
    const res = await getYearlyStats(year)
    yearly.value = res.data
  }

  // 加载仪表盘数据
  async function loadDashboard() {
    loading.value = true
    try {
      await Promise.all([
        fetchOverview(),
        fetchToday(),
        fetchWeek(),
        fetchMonth(),
      ])
    } finally {
      loading.value = false
    }
  }

  return {
    overview,
    today,
    week,
    month,
    trend,
    categoryStats,
    yearly,
    loading,
    fetchOverview,
    fetchToday,
    fetchWeek,
    fetchMonth,
    fetchTrend,
    fetchCategoryStats,
    fetchYearly,
    loadDashboard,
  }
})
