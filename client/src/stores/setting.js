import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSettings, updateSettings, checkBudget } from '@/api/setting'
import { ElMessage } from 'element-plus'

export const useSettingStore = defineStore('setting', () => {
  const settings = ref({
    nickname: '用户',
    monthly_budget: '5000',
    budget_alert: '1',
    data_path: '',
  })
  const budgetInfo = ref(null)
  const loading = ref(false)

  // 获取设置
  async function fetchSettings() {
    const res = await getSettings()
    settings.value = res.data
  }

  // 更新设置
  async function saveSettings(data) {
    await updateSettings(data)
    ElMessage.success('设置已保存')
    await fetchSettings()
  }

  // 检查预算
  async function fetchBudgetInfo() {
    const res = await checkBudget()
    budgetInfo.value = res.data
  }

  return {
    settings,
    budgetInfo,
    loading,
    fetchSettings,
    saveSettings,
    fetchBudgetInfo,
  }
})
