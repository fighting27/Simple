import api from './index'

function monthParams(year, month) {
  const params = {}
  if (year) params.year = year
  if (month) params.month = month
  return params
}

export function getAISummary(year, month) {
  return api.get('/ai/summary', { params: monthParams(year, month) })
}

export function getAILLMSummary(year, month) {
  return api.get('/ai/llm-summary', { params: monthParams(year, month) })
}

export function askAIQuestion(question, year, month) {
  return api.post('/ai/chat', { question, year, month })
}

export function getAIComparison(year, month) {
  return api.get('/ai/comparison', { params: monthParams(year, month) })
}

export function getAIAnomalies(year, month, threshold) {
  const params = monthParams(year, month)
  if (threshold) params.threshold = threshold
  return api.get('/ai/anomalies', { params })
}

export function getAIPrediction(year, month) {
  return api.get('/ai/prediction', { params: monthParams(year, month) })
}

export function getAIInsights(year, month) {
  return api.get('/ai/insights', { params: monthParams(year, month) })
}

export function getAIHealth() {
  return api.get('/ai/health')
}

export function getAIConfig() {
  return api.get('/ai/config')
}

export function updateAIConfig(data) {
  return api.post('/ai/config', data)
}

export function testAIConnection() {
  return api.post('/ai/test-connection')
}
