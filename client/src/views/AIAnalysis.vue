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
      <!-- AI 对话助手 -->
      <div class="chat-card stagger-item" style="--index: 0">
        <div class="chat-header">
          <div>
            <div class="chat-title">
              <span class="chat-icon">💬</span>
              <span>AI 对话助手</span>
              <span v-if="config.enabled && config.has_key" class="chat-badge">LLM 已接入</span>
              <span v-else class="chat-badge local">本地问答</span>
            </div>
            <p class="chat-desc">可以聊天式记账，也可以问本月支出、预算、分类和异常消费。</p>
          </div>
        </div>

        <div class="chat-messages" ref="chatMessagesRef">
          <div
            v-for="message in chatMessages"
            :key="message.id"
            class="chat-message"
            :class="message.role"
          >
            <div class="message-bubble">
              <p v-for="(line, i) in message.lines" :key="i">{{ line }}</p>
              <div v-if="message.model" class="message-source">
                LLM · {{ message.model }}
              </div>

              <div v-if="message.draft" class="draft-card">
                <div class="draft-grid">
                  <div>
                    <span>类型</span>
                    <strong>{{ message.draft.type === 'income' ? '收入' : '支出' }}</strong>
                  </div>
                  <div>
                    <span>金额</span>
                    <strong class="font-mono">¥{{ message.draft.amount }}</strong>
                  </div>
                  <div>
                    <span>日期</span>
                    <strong>{{ message.draft.transaction_date }}</strong>
                  </div>
                  <div>
                    <span>分类</span>
                    <select v-model="message.draft.category_id" class="draft-select">
                      <option value="">请选择分类</option>
                      <option
                        v-for="cat in getCategoriesByType(message.draft.type)"
                        :key="cat.id"
                        :value="cat.id"
                      >
                        {{ cat.name }}
                      </option>
                    </select>
                  </div>
                </div>
                <input
                  v-model="message.draft.note"
                  class="draft-note"
                  type="text"
                  placeholder="备注"
                />
                <div class="draft-actions">
                  <button class="draft-cancel" @click="cancelDraft(message)">取消</button>
                  <button
                    class="draft-confirm"
                    :disabled="confirmingDraft || !message.draft.category_id"
                    @click="confirmDraft(message)"
                  >
                    {{ confirmingDraft ? '入账中...' : '确认入账' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="chatLoading" class="chat-message assistant">
            <div class="message-bubble typing">正在思考...</div>
          </div>
        </div>

        <div class="quick-prompts">
          <button v-for="prompt in quickPrompts" :key="prompt" @click="sendPrompt(prompt)">
            {{ prompt }}
          </button>
        </div>

        <form class="chat-input-row" @submit.prevent="handleChatSubmit">
          <input
            v-model="chatInput"
            class="chat-input"
            type="text"
            placeholder="例如：今天午饭32 / 昨天工资8000 / 本月花最多的是哪类？"
          />
          <button class="chat-send" :disabled="!chatInput.trim() || chatLoading">
            发送
          </button>
        </form>
      </div>

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
          <div class="llm-text">{{ llmSummary }}</div>
        </div>

        <!-- 未生成状态 -->
        <div v-else-if="llmError && !llmLoading" class="llm-empty">
          {{ llmError }}
        </div>

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
          <span v-if="config.key_preview" class="form-hint">已保存：{{ config.key_preview }}；留空保存时会继续沿用当前 Key</span>
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
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAIStore } from '@/stores/ai'
import { useCategoryStore } from '@/stores/category'
import { useTransactionStore } from '@/stores/transaction'
import { formatAmount } from '@/utils/format'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const aiStore = useAIStore()
const categoryStore = useCategoryStore()
const transactionStore = useTransactionStore()
const {
  summary, comparison, anomalies, prediction, insights,
  llmSummary, llmModel, llmError, llmLoading,
  loading, aiOnline, config, chatLoading
} = storeToRefs(aiStore)

const showConfig = ref(false)
const testing = ref(false)
const testResult = ref(null)
const chatInput = ref('')
const chatMessages = ref([
  {
    id: 1,
    role: 'assistant',
    lines: ['你好，我可以帮你快速记账，也能回答本月支出、预算、分类和异常消费问题。'],
  },
])
const chatMessagesRef = ref(null)
const confirmingDraft = ref(false)
let messageSeed = 2

const quickPrompts = [
  '本月花最多的是哪类？',
  '预计会不会超预算？',
  '有没有异常消费？',
  '今天午饭32',
]

const formData = ref({
  api_key: '',
  base_url: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  enabled: false,
})

const summaryLines = computed(() => summary.value?.split('\n').filter(Boolean) || [])

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
  categoryStore.fetchCategories()
})

function loadData() {
  aiStore.fetchSummary()
}

async function loadLLM() {
  try {
    await aiStore.fetchLLMSummary()
  } catch (e) {
    // User-facing text is stored in llmError.
  }
}

function addMessage(role, content, extra = {}) {
  const lines = Array.isArray(content) ? content : String(content).split('\n').filter(Boolean)
  chatMessages.value.push({
    id: messageSeed++,
    role,
    lines,
    ...extra,
  })
  scrollChatToBottom()
}

function scrollChatToBottom() {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

function sendPrompt(prompt) {
  chatInput.value = prompt
  handleChatSubmit()
}

async function handleChatSubmit() {
  const text = chatInput.value.trim()
  if (!text) return

  chatInput.value = ''
  addMessage('user', text)

  const draft = isQuestionText(text) ? null : parseTransactionText(text)
  if (draft) {
    const categoryReady = Boolean(draft.category_id)
    addMessage(
      'assistant',
      categoryReady
        ? '我识别到一笔账目，请确认后入账。'
        : '我识别到金额和日期，但分类还不够明确。请选择分类后再确认入账。',
      { draft }
    )
    return
  }

  await answerQuestion(text)
}

async function answerQuestion(question) {
  if (config.value.enabled && config.value.has_key) {
    try {
      const result = await aiStore.askQuestion(question)
      addMessage('assistant', result.answer || '模型没有返回有效回答。', { model: result.model })
      return
    } catch (e) {
      addMessage('assistant', '模型暂时没有成功回答，我先用当前页面数据给你一个确定性回答。\n' + localAnswer(question))
      return
    }
  }

  addMessage('assistant', localAnswer(question))
}

function localAnswer(question) {
  const q = question.toLowerCase()

  if (q.includes('最多') || q.includes('最大') || q.includes('分类')) {
    const top = insights.value?.[0]
    if (!top) return '当前还没有足够的分类数据，先多记几笔支出后我就能判断。'
    return `本月支出最多的是「${top.category}」，共 ${formatAmount(top.amount)}，占总支出 ${top.percentage}%，一共 ${top.count} 笔。`
  }

  if (q.includes('预算') || q.includes('超支')) {
    const status = prediction.value?.budget_status
    if (!status) return '当前没有设置月预算，所以无法判断是否超预算。可以先在设置里填写月预算。'
    return `按当前节奏预计月末支出 ${formatAmount(prediction.value.predicted_total)}，预算执行率 ${status.percentage}%。${status.message}`
  }

  if (q.includes('异常') || q.includes('不正常')) {
    const list = anomalies.value?.anomalies || []
    if (!list.length) return anomalies.value?.message || '当前没有发现明显异常消费。'
    const top = list[0]
    return `发现 ${list.length} 天异常消费，最明显的是 ${top.date}，当天支出 ${formatAmount(top.amount)}，高于历史日均 ${formatAmount(anomalies.value.daily_avg)}。`
  }

  if (q.includes('环比') || q.includes('趋势') || q.includes('上月')) {
    const pct = comparison.value?.overall_change_pct ?? 0
    const direction = pct > 0 ? '上涨' : pct < 0 ? '下降' : '持平'
    return `本月支出 ${formatAmount(comparison.value?.this_month?.expense)}，上月支出 ${formatAmount(comparison.value?.last_month?.expense)}，环比${direction} ${Math.abs(pct)}%。`
  }

  if (q.includes('本月') || q.includes('花了') || q.includes('支出')) {
    return `本月已支出 ${formatAmount(comparison.value?.this_month?.expense)}，日均 ${formatAmount(comparison.value?.this_month?.daily_avg)}，预计月末 ${formatAmount(prediction.value?.predicted_total)}。`
  }

  return '未配置 LLM 时，我只能回答确定性账目问题，比如本月支出、分类最多、预算是否超支、异常消费和环比趋势。'
}

function isQuestionText(text) {
  return /[?？]/.test(text) || [
    '多少',
    '哪些',
    '哪个',
    '哪类',
    '是否',
    '会不会',
    '有没有',
    '为什么',
    '怎么',
    '如何',
    '分析',
    '建议',
    '预算',
    '超支',
    '趋势',
    '异常',
  ].some(word => text.includes(word))
}

function parseTransactionText(text) {
  const amountMatch = text.match(/(?:¥|￥)?\s*(\d+(?:\.\d{1,2})?)\s*(?:元|块|rmb)?/i)
  if (!amountMatch) return null

  const amount = Number(amountMatch[1])
  if (!amount || amount <= 0) return null

  const type = inferType(text)
  const transactionDate = inferDate(text)
  const cleaned = text
    .replace(amountMatch[0], '')
    .replace(/今天|今日|当天|昨天|昨日|前天|明天|收入|支出|花了|花|消费|买|工资|奖金|报销|转入|入账|收到|赚了/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const categories = getCategoriesByType(type)
  const matchedCategory = matchCategory(text, categories)

  return {
    type,
    amount,
    category_id: matchedCategory?.id || '',
    category_name: matchedCategory?.name || '',
    transaction_date: transactionDate,
    note: cleaned || matchedCategory?.name || (type === 'income' ? '收入' : '支出'),
  }
}

function inferType(text) {
  const incomeWords = ['工资', '奖金', '收入', '报销', '转入', '收款', '收到', '赚了', '兼职']
  return incomeWords.some(word => text.includes(word)) ? 'income' : 'expense'
}

function inferDate(text) {
  const today = dayjs()
  if (text.includes('前天')) return today.subtract(2, 'day').format('YYYY-MM-DD')
  if (text.includes('昨天') || text.includes('昨日')) return today.subtract(1, 'day').format('YYYY-MM-DD')
  if (text.includes('明天')) return today.add(1, 'day').format('YYYY-MM-DD')

  const fullDate = text.match(/(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/)
  if (fullDate) return dayjs(`${fullDate[1]}-${fullDate[2]}-${fullDate[3]}`).format('YYYY-MM-DD')

  const monthDay = text.match(/(\d{1,2})[月/-](\d{1,2})[日号]?/)
  if (monthDay) return dayjs(`${today.year()}-${monthDay[1]}-${monthDay[2]}`).format('YYYY-MM-DD')

  const dayOnly = text.match(/(?:^|\D)(\d{1,2})[日号](?:\D|$)/)
  if (dayOnly) return dayjs(`${today.year()}-${today.month() + 1}-${dayOnly[1]}`).format('YYYY-MM-DD')

  return today.format('YYYY-MM-DD')
}

function matchCategory(text, categories) {
  const aliases = {
    餐饮: ['饭', '午饭', '晚饭', '早饭', '早餐', '午餐', '晚餐', '吃', '餐', '奶茶', '咖啡', '外卖'],
    交通: ['打车', '公交', '地铁', '出租', '滴滴', '加油', '停车', '高铁', '机票'],
    购物: ['买', '购物', '衣服', '鞋', '淘宝', '京东', '拼多多'],
    娱乐: ['电影', '游戏', 'ktv', '唱歌', '娱乐', '会员'],
    房租: ['房租', '租金', '物业', '水电', '电费', '水费'],
    工资: ['工资', '薪水', '奖金', '绩效'],
    红包: ['红包', '转账'],
    理财: ['理财', '利息', '基金', '股票'],
  }

  return categories.find(cat => {
    if (text.includes(cat.name)) return true
    const words = aliases[cat.name] || []
    return words.some(word => text.includes(word))
  })
}

function getCategoriesByType(type) {
  return type === 'income' ? categoryStore.incomeCategories : categoryStore.expenseCategories
}

async function confirmDraft(message) {
  if (!message.draft?.category_id) {
    ElMessage.warning('请选择分类')
    return
  }

  confirmingDraft.value = true
  try {
    await transactionStore.addTransaction({
      ...message.draft,
      category_id: Number(message.draft.category_id),
    })
    message.draft = null
    message.lines = ['已确认入账，我也刷新了当前 AI 分析数据。']
    await aiStore.fetchSummary()
  } finally {
    confirmingDraft.value = false
  }
}

function cancelDraft(message) {
  message.draft = null
  message.lines = ['已取消这笔待确认账目。']
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
.chat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  padding: 22px 24px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-diffusion);
  transition: var(--transition);
  &:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.chat-icon { font-size: 18px; }

.chat-badge {
  padding: 2px 8px;
  border-radius: 5px;
  background: #ECFDF5;
  color: #047857;
  font-size: 11px;
  font-weight: 600;

  &.local {
    background: var(--bg-hover);
    color: var(--text-muted);
  }
}

.chat-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

.chat-messages {
  max-height: 360px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 2px 12px;
}

.chat-message {
  display: flex;

  &.user {
    justify-content: flex-end;

    .message-bubble {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
  }

  &.assistant {
    justify-content: flex-start;
  }
}

.message-bubble {
  max-width: min(680px, 86%);
  padding: 12px 14px;
  background: var(--bg-hover);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);

  p + p { margin-top: 4px; }

  &.typing {
    color: var(--text-muted);
  }
}

.message-source {
  margin-top: 8px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.draft-card {
  margin-top: 10px;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

.draft-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;

  span {
    display: block;
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  strong {
    font-size: 13px;
    font-weight: 600;
  }
}

.draft-select,
.draft-note {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-sans);
}

.draft-select {
  padding: 5px 8px;
}

.draft-note {
  padding: 8px 10px;
  margin-bottom: 10px;
}

.draft-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.draft-cancel,
.draft-confirm {
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  transition: var(--transition);
}

.draft-cancel {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.draft-confirm {
  background: var(--primary);
  color: white;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;

  button {
    padding: 6px 10px;
    background: var(--bg-hover);
    color: var(--text-secondary);
    border-radius: 6px;
    font-size: 12px;
    transition: var(--transition);

    &:hover {
      background: var(--primary-bg);
      color: var(--primary-dark);
    }
  }
}

.chat-input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.chat-input {
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-sans);

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--border-focus);
  }
}

.chat-send {
  padding: 0 18px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-xs);
  font-size: 13px;
  font-weight: 600;
  transition: var(--transition);

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.llm-card {
  background: linear-gradient(135deg, #EEF2FF 0%, var(--bg-card) 100%);
  border: 1px solid #C7D2FE;
  border-radius: var(--radius);
  padding: 24px 28px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-diffusion);
  transition: var(--transition);
  height: auto;
  overflow: visible;
  &:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }
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
  height: auto;
  overflow: visible;

  .llm-text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.9;
    letter-spacing: 0;
  }

  .llm-line {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.8;
    letter-spacing: 0;
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
  transition: var(--transition);
  &:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }
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
  transition: var(--transition);
  &:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }
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
  transition: var(--transition);
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
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
  .chat-card { padding: 18px; }
  .message-bubble { max-width: 94%; }
  .draft-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .chat-input-row { grid-template-columns: 1fr; }
  .chat-send { height: 40px; }
}
</style>
