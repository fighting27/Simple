import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAISummary, getAILLMSummary, getAIConfig, updateAIConfig, testAIConnection } from '@/api/ai'

export const useAIStore = defineStore('ai', () => {
  // 规则引擎数据
  const summary = ref('')
  const comparison = ref(null)
  const anomalies = ref(null)
  const prediction = ref(null)
  const insights = ref([])

  // LLM 数据
  const llmSummary = ref('')
  const llmModel = ref('')
  const llmLoading = ref(false)

  // 状态
  const loading = ref(false)
  const aiOnline = ref(false)

  // LLM 配置
  const config = ref({
    has_key: false,
    base_url: '',
    model: '',
    enabled: false,
  })

  async function fetchSummary(year, month) {
    loading.value = true
    try {
      const res = await getAISummary(year, month)
      const data = res.data
      summary.value = data.summary
      comparison.value = data.comparison
      anomalies.value = data.anomalies
      prediction.value = data.prediction
      insights.value = data.insights
      aiOnline.value = true
    } catch (e) {
      aiOnline.value = false
    } finally {
      loading.value = false
    }
  }

  async function fetchLLMSummary(year, month) {
    llmLoading.value = true
    try {
      const res = await getAILLMSummary(year, month)
      const data = res.data
      llmSummary.value = data.llm_summary
      llmModel.value = data.model
    } catch (e) {
      llmSummary.value = ''
    } finally {
      llmLoading.value = false
    }
  }

  async function fetchConfig() {
    try {
      const res = await getAIConfig()
      config.value = res.data
    } catch (e) {
      // ignore
    }
  }

  async function saveConfig(data) {
    const res = await updateAIConfig(data)
    config.value = res.data
    return res
  }

  async function testConnection() {
    return await testAIConnection()
  }

  return {
    summary,
    comparison,
    anomalies,
    prediction,
    insights,
    llmSummary,
    llmModel,
    llmLoading,
    loading,
    aiOnline,
    config,
    fetchSummary,
    fetchLLMSummary,
    fetchConfig,
    saveConfig,
    testConnection,
  }
})
