import api from './index'

// AI 综合分析报告（规则引擎）
export function getAISummary(year, month) {
  const params = {}
  if (year) params.year = year
  if (month) params.month = month
  return api.get('/ai/summary', { params })
}

// LLM 深度分析报告
export function getAILLMSummary(year, month) {
  const params = {}
  if (year) params.year = year
  if (month) params.month = month
  return api.get('/ai/llm-summary', { params })
}

// 月度环比对比
export function getAIComparison(year, month) {
  const params = {}
  if (year) params.year = year
  if (month) params.month = month
  return api.get('/ai/comparison', { params })
}

// 异常消费检测
export function getAIAnomalies(year, month, threshold) {
  const params = {}
  if (year) params.year = year
  if (month) params.month = month
  if (threshold) params.threshold = threshold
  return api.get('/ai/anomalies', { params })
}

// 月末支出预测
export function getAIPrediction(year, month) {
  const params = {}
  if (year) params.year = year
  if (month) params.month = month
  return api.get('/ai/prediction', { params })
}

// 分类深度洞察
export function getAIInsights(year, month) {
  const params = {}
  if (year) params.year = year
  if (month) params.month = month
  return api.get('/ai/insights', { params })
}

// AI 健康检查
export function getAIHealth() {
  return api.get('/ai/health')
}

// 获取 LLM 配置状态
export function getAIConfig() {
  return api.get('/ai/config')
}

// 更新 LLM 配置
export function updateAIConfig(data) {
  return api.post('/ai/config', data)
}

// 测试 LLM 连接
export function testAIConnection() {
  return api.post('/ai/test-connection')
}
