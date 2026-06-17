import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  askAIQuestion,
  getAIConfig,
  getAILLMSummary,
  getAISummary,
  testAIConnection,
  updateAIConfig,
} from '@/api/ai'

export const useAIStore = defineStore('ai', () => {
  const summary = ref('')
  const comparison = ref(null)
  const anomalies = ref(null)
  const prediction = ref(null)
  const insights = ref([])

  const llmSummary = ref('')
  const llmModel = ref('')
  const llmLoading = ref(false)
  const chatLoading = ref(false)

  const loading = ref(false)
  const aiOnline = ref(false)

  const config = ref({
    has_key: false,
    key_preview: '',
    base_url: '',
    model: '',
    enabled: false,
    source: 'default',
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
      throw e
    } finally {
      llmLoading.value = false
    }
  }

  async function askQuestion(question, year, month) {
    chatLoading.value = true
    try {
      const res = await askAIQuestion(question, year, month)
      return res.data
    } finally {
      chatLoading.value = false
    }
  }

  async function fetchConfig() {
    try {
      const res = await getAIConfig()
      config.value = res.data
      return res.data
    } catch (e) {
      return config.value
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
    chatLoading,
    loading,
    aiOnline,
    config,
    fetchSummary,
    fetchLLMSummary,
    askQuestion,
    fetchConfig,
    saveConfig,
    testConnection,
  }
})
