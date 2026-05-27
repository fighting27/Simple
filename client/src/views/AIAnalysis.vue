<template>
  <div class="ai-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1>AI 智能分析</h1>
        <p class="header-desc">基于你的记账数据，AI 为你生成深度洞察</p>
      </div>
      <div class="header-right">
        <button class="config-btn" @click="showConfig = true">
          <el-icon :size="14"><Setting /></el-icon>
          模型配置
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <template v-if="loading">
      <div class="bento-grid">
        <div class="bento-card full-width stagger-item" style="--index: 0">
          <div class="skeleton skeleton-text" style="width: 100px; margin-bottom: 16px;"></div>
          <div class="skeleton skeleton-text" style="width: 100%; margin-bottom: 8px;"></div>
          <div class="skeleton skeleton-text" style="width: 80%; margin-bottom: 8px;"></div>
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
        </div>
        <div class="bento-card stagger-item" style="--index: 1">
          <div class="skeleton skeleton-text" style="width: 80px; margin-bottom: 16px;"></div>
          <div class="skeleton skeleton-number" style="width: 120px; height: 40px;"></div>
        </div>
        <div class="bento-card stagger-item" style="--index: 2">
          <div class="skeleton skeleton-text" style="width: 80px; margin-bottom: 16px;"></div>
          <div class="skeleton skeleton-number" style="width: 120px; height: 40px;"></div>
        </div>
      </div>
    </template>

    <!-- AI 离线提示 -->
    <template v-else-if="!aiOnline">
      <div class="offline-card">
        <div class="offline-icon">🧠</div>
        <h3>AI 分析服务未启动</h3>
        <p>请先启动 Python AI 服务：</p>
        <code>cd python-ai && .venv\Scripts\python app.py</code>
        <button class="retry-btn" @click="loadData">
          <el-icon :size="14"><Refresh /></el-icon>
          重新连接
        </button>
      </div>
    </template>

    <!-- 正常内容 -->
    <template v-else>
      <!-- LLM 深度分析卡片 -->
      <div class="llm-card stagger-item" style="--index: 0">
        <div class="llm-header">
          <div class="llm-title">
            <span class="llm-icon">🤖</span>
            <span>大模型深度分析</span>
            <span v-if="llmModel" class="llm-model font-mono">{{ llmModel }}</span>
          </div>
          <button
            class="llm-btn"
            :class="{ disabled: !config.has_key || !config.enabled }"
            :disabled="llmLoading || !config.has_key || !config.enabled"
            @click="loadLLM"
          >
            <el-icon v-if="llmLoading" class="is-loading"><Loading /></el-icon>
            <el-icon v-else><MagicStick /></el-icon>
            {{ llmLoading ? '分析中...' : '生成分析' }}
          </button>
        </div>

        <!-- LLM 未配置提示 -->
        <div v-if="!config.has_key || !config.enabled" class="llm-hint">
          <p>💡 配置 API Key 后可使用大模型生成更智能的分析报告</p>
          <button class="hint-btn" @click="showConfig = true">去配置</button>
        </div>

        <!-- LLM 分析结果 -->
        <div v-else-if="llmSummary" class="llm-content">
          <p v-for="(line, i) in llmLines" :key="i" class="llm-line">{{ line }}</p>
        </div>

        <!-- 未生成状态 -->
        <div v-else-if="!llmLoading" class="llm-empty">
          点击「生成分析」让大模型为你解读财务数据
        </div>
      </div>

      <!-- 规则引擎摘要 -->
      <div class="summary-card stagger-item" style="--index: 1">
        <div class="summary-header">
          <span class="summary-icon">📊</span>
          <span class="summary-title">数据概览</span>
        </div>
        <div class="summary-text">
          <p v-for="(line, i) in summaryLines" :key="i" class="summary-line">{{ line }}</p>
        </div>
      </div>

      <!-- 核心指标 Grid -->
      <div class="bento-grid">
        <div class="bento-card stagger-item" style="--index: 2">
          <div class="bento-label">本月支出</div>
          <div class="bento-value expense font-mono">{{ formatAmount(comparison?.this_month?.expense) }}</div>
          <div class="bento-sub">
            日均 <span class="font-mono">{{ formatAmount(comparison?.this_month?.daily_avg) }}</span>
          </div>
        </div>

        <div class="bento-card stagger-item" style="--index: 3">
          <div class="bento-label">环比上月</div>
          <div class="bento-value" :class="changeClass">
            {{ changePrefix }}{{ comparison?.overall_change_pct ?? 0 }}%
          </div>
          <div class="bento-sub">
            上月 <span class="font-mono">{{ formatAmount(comparison?.last_month?.expense) }}</span>
          </div>
        </div>

        <div class="bento-card stagger-item" style="--index: 4">
          <div class="bento-label">预测月末</div>
          <div class="bento-value font-mono">{{ formatAmount(prediction?.predicted_total) }}</div>
          <div class="bento-sub">置信度：{{ confidenceLabel }}</div>
        </div>
      </div>

      <!-- 预算进度条 -->
      <div v-if="prediction?.budget_status" class="budget-card stagger-item" style="--index: 5">
        <div class="budget-header">
          <span class="budget-title">预算执行</span>
          <span class="budget-pct font-mono" :class="budgetStatusClass">
            {{ prediction.budget_status.percentage }}%
          </span>
        </div>
        <div class="budget-bar-track">
          <div
            class="budget-bar-fill"
            :class="budgetStatusClass"
            :style="{ width: Math.min(prediction.budget_status.percentage, 100) + '%' }"
          ></div>
        </div>
        <div class="budget-msg" :class="budgetStatusClass">
          {{ prediction.budget_status.message }}
        </div>
      </div>

      <!-- 分类洞察 -->
      <div class="insights-section stagger-item" style="--index: 6">
        <h3 class="section-title">分类洞察</h3>
        <div class="insights-grid">
          <div
            v-for="(item, i) in insights"
            :key="item.category"
            class="insight-card"
            :style="{ '--delay': i * 0.05 + 's' }"
          >
            <div class="insight-header">
              <span class="insight-rank">#{{ i + 1 }}</span>
              <span class="insight-name">{{ item.category }}</span>
              <span class="insight-pct font-mono">{{ item.percentage }}%</span>
            </div>
            <div class="insight-amount font-mono">{{ formatAmount(item.amount) }}</div>
            <div class="insight-meta">
              <span>{{ item.count }} 笔</span>
              <span>单笔均 ¥{{ item.avg_per_transaction }}</span>
              <span :class="item.pct_change > 0 ? 'up' : item.pct_change < 0 ? 'down' : ''">
                {{ item.pct_change > 0 ? '↑' : item.pct_change < 0 ? '↓' : '→' }}
                {{ Math.abs(item.pct_change) }}%
              </span>
            </div>
            <div v-if="item.suggestion !== '正常范围'" class="insight-suggestion">
              💡 {{ item.suggestion }}
            </div>
          </div>
        </div>
      </div>

      <!-- 异常消费 -->
      <div v-if="anomalies?.anomalies?.length" class="anomaly-section stagger-item" style="--index: 7">
        <h3 class="section-title">⚠️ 异常消费</h3>
        <div class="anomaly-list">
          <div v-for="a in anomalies.anomalies" :key="a.date" class="anomaly-item">
            <div class="anomaly-date">{{ a.date }}</div>
            <div class="anomaly-amount font-mono">{{ formatAmount(a.amount) }}</div>
            <div class="anomaly-detail">日均 ¥{{ anomalies.daily_avg }}，超出 {{ a.z_score }}σ</div>
            <div v-if="a.top_expenses?.length" class="anomaly-expenses">
              <span v-for="e in a.top_expenses" :key="e.note" class="anomaly-tag">
                {{ e.category }} ¥{{ e.amount }}{{ e.note ? ' · ' + e.note : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="anomalies?.message" class="no-anomaly stagger-item" style="--index: 7">
        ✅ {{ anomalies.message }}
      </div>
    </template>

    <!-- 配置弹窗 -->
    <el-dialog v-model="showConfig" title="AI 模型配置" width="480px" destroy-on-close>
      <div class="config-form">
        <div class="form-item">
          <label>API 地址</label>
          <el-input v-model="formData.base_url" placeholder="https://api.deepseek.com/v1" />
          <span class="form-hint">支持 OpenAI 兼容接口：DeepSeek / OpenAI / 通义千问等</span>
        </div>
        <div class="form-item">
          <label>API Key</label>
          <el-input v-model="formData.api_key" type="password" show-password placeholder="sk-..." />
        </div>
        <div class="form-item">
          <label>模型名称</label>
          <el-input v-model="formData.model" placeholder="deepseek-chat" />
          <span class="form-hint">如 deepseek-chat / gpt-4o / qwen-turbo</span>
        </div>
        <div class="form-item">
          <label>
            <el-switch v-model="formData.enabled" />
            启用大模型分析
          </label>
        </div>
      </div>
      <template #footer>
        <div class="config-footer">
          <button class="test-btn" :disabled="testing" @click="handleTest">
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
          <div class="footer-right">
            <button class="cancel-btn" @click="showConfig = false">取消</button>
            <button class="save-btn" @click="handleSave">保存</button>
          </div>
        </div>
        <div v-if="testResult" class="test-result" :class="testResult.ok ? 'success' : 'error'">
          {{ testResult.message }}
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAIStore } from '@/stores/ai'
import { formatAmount } from '@/utils/format'
import { ElMessage } from 'element-plus'

const aiStore = useAIStore()
const {
  summary, comparison, anomalies, prediction, insights,
  llmSummary, llmModel, llmLoading,
  loading, aiOnline, config
} = storeToRefs(aiStore)

const showConfig = ref(false)
const testing = ref(false)
const testResult = ref(null)

const formData = ref({
  api_key: '',
  base_url: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  enabled: false,
})

const summaryLines = computed(() => summary.value?.split('\n').filter(Boolean) || [])
const llmLines = computed(() => llmSummary.value?.split('\n').filter(Boolean) || [])

const changeClass = computed(() => {
  const pct = comparison.value?.overall_change_pct ?? 0
  if (pct > 0) return 'expense'
  if (pct < 0) return 'income'
  return ''
})

const changePrefix = computed(() => {
  const pct = comparison.value?.overall_change_pct ?? 0
  return pct > 0 ? '+' : ''
})

const confidenceLabel = computed(() => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[prediction.value?.confidence] ?? '-'
})

const budgetStatusClass = computed(() => {
  const s = prediction.value?.budget_status?.status
  if (s === 'over') return 'over'
  if (s === 'warning') return 'warning'
  return 'safe'
})

// 打开配置弹窗时同步数据
watch(showConfig, (val) => {
  if (val) {
    formData.value = {
      api_key: '',
      base_url: config.value.base_url || 'https://api.deepseek.com/v1',
      model: config.value.model || 'deepseek-chat',
      enabled: config.value.enabled ?? false,
    }
    testResult.value = null
  }
})

onMounted(() => {
  loadData()
  aiStore.fetchConfig()
})

function loadData() {
  aiStore.fetchSummary()
}

function loadLLM() {
  aiStore.fetchLLMSummary()
}

async function handleTest() {
  testing.value = true
  testResult.value = null
  try {
    // 先保存配置再测试
    await aiStore.saveConfig(formData.value)
    const res = await aiStore.testConnection()
    testResult.value = { ok: true, message: res.message }
  } catch (e) {
    testResult.value = { ok: false, message: e.message || '连接失败' }
  } finally {
    testing.value = false
  }
}

async function handleSave() {
  try {
    await aiStore.saveConfig(formData.value)
    ElMessage.success('配置已保存')
    showConfig.value = false
  } catch (e) {
    ElMessage.error('保存失败')
  }
}
</script>

<style lang="scss" scoped>
.ai-page {
  animation: fadeIn 0.5s var(--ease-spring);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 28px;

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.04em;
    margin-bottom: 4px;
  }

  .header-desc {
    font-size: 14px;
    color: var(--text-muted);
  }
}

.config-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: var(--transition);

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
}

// 离线卡片
.offline-card {
  text-align: center;
  padding: 60px 24px;
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-diffusion);

  .offline-icon { font-size: 48px; margin-bottom: 16px; }
  h3 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
  p { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; }

  code {
    display: inline-block;
    padding: 8px 16px;
    background: var(--bg-hover);
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--primary-dark);
    margin-bottom: 20px;
  }

  .retry-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: var(--primary);
    color: white;
    border-radius: var(--radius-xs);
    font-size: 13px;
    font-weight: 600;
    transition: var(--transition);
    &:hover { background: var(--primary-dark); transform: translateY(-1px); }
  }
}

// LLM 卡片
.llm-card {
  background: linear-gradient(135deg, #EEF2FF 0%, var(--bg-card) 100%);
  border: 1px solid #C7D2FE;
  border-radius: var(--radius);
  padding: 24px 28px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-diffusion);
}

.llm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.llm-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.llm-icon { font-size: 20px; }

.llm-model {
  font-size: 11px;
  color: #6366F1;
  background: #EEF2FF;
  padding: 2px 8px;
  border-radius: 4px;
}

.llm-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #6366F1;
  color: white;
  border-radius: var(--radius-xs);
  font-size: 13px;
  font-weight: 600;
  transition: var(--transition);

  &:hover:not(.disabled) { background: #4F46E5; transform: translateY(-1px); }
  &.disabled { opacity: 0.5; cursor: not-allowed; }
}

.llm-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #FFFBEB;
  border-radius: var(--radius-xs);
  border: 1px solid #FDE68A;

  p { font-size: 13px; color: #92400E; }

  .hint-btn {
    padding: 6px 12px;
    background: #F59E0B;
    color: white;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    transition: var(--transition);
    &:hover { background: #D97706; }
  }
}

.llm-content {
  .llm-line {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.8;
    letter-spacing: -0.01em;
  }
}

.llm-empty {
  text-align: center;
  padding: 24px;
  font-size: 14px;
  color: var(--text-muted);
}

// 规则引擎摘要
.summary-card {
  background: linear-gradient(135deg, var(--primary-bg) 0%, var(--bg-card) 100%);
  border: 1px solid var(--primary-light);
  border-radius: var(--radius);
  padding: 28px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-diffusion);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.summary-icon { font-size: 20px; }
.summary-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }

.summary-text .summary-line {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.8;
}

// Bento Grid
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.bento-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 24px 28px;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-diffusion);
  transition: var(--transition);
  &:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }
}

.bento-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

.bento-value {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 8px;
  color: var(--text-primary);
  &.income { color: var(--income); }
  &.expense { color: var(--expense); }
}

.bento-sub {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

// 预算
.budget-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 24px 28px;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-diffusion);
  margin-bottom: 20px;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.budget-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }

.budget-pct {
  font-size: 20px;
  font-weight: 700;
  &.safe { color: var(--income); }
  &.warning { color: #F59E0B; }
  &.over { color: var(--expense); }
}

.budget-bar-track {
  width: 100%;
  height: 8px;
  background: var(--bg-hover);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 8px;
}

.budget-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.8s var(--ease-spring);
  &.safe { background: var(--income); }
  &.warning { background: #F59E0B; }
  &.over { background: var(--expense); }
}

.budget-msg {
  font-size: 13px;
  font-weight: 500;
  &.safe { color: var(--income); }
  &.warning { color: #F59E0B; }
  &.over { color: var(--expense); }
}

// 分类洞察
.insights-section { margin-bottom: 20px; }

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.insight-card {
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  padding: 20px;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  animation: slideUp 0.4s var(--ease-spring) var(--delay) both;
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.insight-rank {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-hover);
  padding: 2px 6px;
  border-radius: 4px;
}

.insight-name { font-size: 14px; font-weight: 600; color: var(--text-primary); flex: 1; }
.insight-pct { font-size: 13px; font-weight: 600; color: var(--primary); }

.insight-amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.insight-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-muted);
  .up { color: var(--expense); }
  .down { color: var(--income); }
}

.insight-suggestion {
  margin-top: 10px;
  padding: 8px 12px;
  background: #FFF7ED;
  border-radius: var(--radius-xs);
  font-size: 12px;
  color: #92400E;
  line-height: 1.5;
}

// 异常
.anomaly-section { margin-bottom: 20px; }
.anomaly-list { display: flex; flex-direction: column; gap: 10px; }

.anomaly-item {
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  padding: 18px 20px;
  border: 1px solid #FEE2E2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.anomaly-date { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.anomaly-amount { font-size: 18px; font-weight: 700; color: var(--expense); }
.anomaly-detail { font-size: 12px; color: var(--text-muted); }

.anomaly-expenses {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.anomaly-tag {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-hover);
  padding: 3px 8px;
  border-radius: 4px;
}

.no-anomaly {
  text-align: center;
  padding: 24px;
  font-size: 14px;
  color: var(--income);
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
}

// 配置弹窗
.config-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-hint {
    font-size: 12px;
    color: var(--text-muted);
  }
}

.config-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-btn {
  padding: 8px 16px;
  background: #F59E0B;
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  transition: var(--transition);
  &:hover:not(:disabled) { background: #D97706; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.footer-right {
  display: flex;
  gap: 8px;
}

.cancel-btn {
  padding: 8px 16px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
  &:hover { background: var(--bg-active); }
}

.save-btn {
  padding: 8px 16px;
  background: var(--primary);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  transition: var(--transition);
  &:hover { background: var(--primary-dark); }
}

.test-result {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;

  &.success {
    background: #D1FAE5;
    color: #065F46;
  }

  &.error {
    background: #FEE2E2;
    color: #991B1B;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    h1 { font-size: 22px; }
  }

  .bento-grid { grid-template-columns: 1fr; }
  .bento-value { font-size: 22px; }
  .insights-grid { grid-template-columns: 1fr; }
  .llm-header { flex-direction: column; gap: 12px; align-items: flex-start; }
}
</style>
