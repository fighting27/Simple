<template>
  <div class="dashboard">
    <!-- 欢迎区域 - 左对齐不对称 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h1>{{ greeting }}，{{ settings.nickname }}</h1>
        <p class="quote">{{ dailyQuote }}</p>
      </div>
      <button class="quick-add-btn pressable" @click="showQuickAdd = true">
        <el-icon :size="16"><Plus /></el-icon>
        快速记账
      </button>
    </div>

    <!-- 预算提醒 -->
    <BudgetAlert v-if="budgetInfo && budgetInfo.exceeded" :info="budgetInfo" />

    <!-- Bento Grid - 不对称布局 -->
    <div class="bento-grid">
      <!-- 今日数据 - 大卡片 -->
      <div class="bento-card bento-today stagger-item" style="--index: 0">
        <div class="bento-label">今日</div>
        <div class="bento-metrics">
          <div class="bento-metric">
            <span class="metric-value expense font-mono">{{ formatAmount(today.expense) }}</span>
            <span class="metric-label">支出</span>
          </div>
          <div class="bento-metric">
            <span class="metric-value income font-mono">{{ formatAmount(today.income) }}</span>
            <span class="metric-label">收入</span>
          </div>
        </div>
      </div>

      <!-- 本月数据 -->
      <div class="bento-card bento-month stagger-item" style="--index: 1">
        <div class="bento-label">本月</div>
        <div class="bento-metrics">
          <div class="bento-metric">
            <span class="metric-value expense font-mono">{{ formatAmount(month.expense) }}</span>
            <span class="metric-label">支出</span>
          </div>
          <div class="bento-metric">
            <span class="metric-value income font-mono">{{ formatAmount(month.income) }}</span>
            <span class="metric-label">收入</span>
          </div>
        </div>
      </div>

      <!-- 当前结余 - 突出显示 -->
      <div class="bento-card bento-balance stagger-item" style="--index: 2">
        <div class="bento-label">当前结余</div>
        <div class="balance-value font-mono" :class="overview.balance >= 0 ? 'income' : 'expense'">
          {{ overview.balance >= 0 ? '+' : '' }}{{ formatAmount(overview.balance) }}
        </div>
        <div class="balance-hint">累计收支</div>
      </div>
    </div>

    <!-- 图表区域 - 2 列不对称 -->
    <div class="charts-grid">
      <div class="card chart-card stagger-item" style="--index: 3">
        <h3>月度趋势</h3>
        <TrendChart :data="trend" />
      </div>
      <div class="card chart-card stagger-item" style="--index: 4">
        <h3>支出分类</h3>
        <PieChart :data="categoryStats" type="expense" />
      </div>
    </div>

    <!-- 最近记录 - 无卡片包裹，用间距呼吸 -->
    <div class="recent-section stagger-item" style="--index: 5">
      <div class="section-header">
        <h3>最近记录</h3>
        <router-link to="/transactions" class="view-all">
          查看全部
          <el-icon :size="14"><ArrowRight /></el-icon>
        </router-link>
      </div>
      <div class="recent-list-wrapper">
        <TransactionList :transactions="recentTransactions" :show-pagination="false" :show-actions="false" />
      </div>
    </div>

    <!-- 快速记账弹窗 -->
    <el-dialog v-model="showQuickAdd" title="快速记账" width="420px" destroy-on-close>
      <TransactionForm @success="handleQuickAddSuccess" @cancel="showQuickAdd = false" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useStatisticsStore } from '@/stores/statistics'
import { useSettingStore } from '@/stores/setting'
import { useTransactionStore } from '@/stores/transaction'
import { formatAmount } from '@/utils/format'
import TransactionForm from '@/components/TransactionForm.vue'
import TransactionList from '@/components/TransactionList.vue'
import BudgetAlert from '@/components/BudgetAlert.vue'
import TrendChart from '@/components/TrendChart.vue'
import PieChart from '@/components/PieChart.vue'

const statisticsStore = useStatisticsStore()
const settingStore = useSettingStore()
const transactionStore = useTransactionStore()

const { overview, today, week, month, trend, categoryStats } = storeToRefs(statisticsStore)
const { settings, budgetInfo } = storeToRefs(settingStore)

const showQuickAdd = ref(false)

const recentTransactions = computed(() => transactionStore.transactions.slice(0, 8))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const quotes = [
  '理财是一种生活方式',
  '今天的储蓄，明天的自由',
  '记录每一笔，掌控每一天',
  '省钱就是赚钱',
  '财富积累，从记账开始',
]
const dailyQuote = computed(() => quotes[new Date().getDate() % quotes.length])

onMounted(async () => {
  await Promise.all([
    statisticsStore.loadDashboard(),
    statisticsStore.fetchTrend(),
    statisticsStore.fetchCategoryStats({ type: 'expense' }),
    settingStore.fetchBudgetInfo(),
    transactionStore.fetchTransactions({ page: 1, page_size: 8 }),
  ])
})

function handleQuickAddSuccess() {
  showQuickAdd.value = false
  statisticsStore.loadDashboard()
  statisticsStore.fetchTrend()
  statisticsStore.fetchCategoryStats({ type: 'expense' })
  transactionStore.fetchTransactions({ page: 1, page_size: 8 })
  settingStore.fetchBudgetInfo()
}
</script>

<style lang="scss" scoped>
.dashboard {
  animation: fadeIn 0.5s var(--ease-spring);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

// 欢迎区域 - 左对齐
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 36px;
}

.welcome-text {
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.04em;
    margin-bottom: 6px;
    line-height: 1.2;
  }

  .quote {
    font-size: 14px;
    color: var(--text-muted);
    font-weight: 400;
  }
}

.quick-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-xs);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  transition: var(--transition);

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
}

// Bento Grid - 不对称 3 列
.bento-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.bento-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 24px 28px;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-diffusion);
  transition: var(--transition);

  &:hover {
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);
  }
}

.bento-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 16px;
}

.bento-metrics {
  display: flex;
  gap: 32px;
}

.bento-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;

  &.income { color: var(--income); }
  &.expense { color: var(--expense); }
}

.metric-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

// 结余卡片 - 突出
.bento-balance {
  background: linear-gradient(135deg, var(--primary-bg) 0%, var(--bg-card) 100%);
  border-color: var(--primary-light);
}

.balance-value {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 8px;

  &.income { color: var(--income); }
  &.expense { color: var(--expense); }
}

.balance-hint {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

// 图表区域 - 2 列
.charts-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
}

// 最近记录 - 无卡片包裹
.recent-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }
}

.view-all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--primary);
  font-weight: 500;
  text-decoration: none;
  transition: var(--transition);

  &:hover {
    color: var(--primary-dark);
    gap: 6px;
  }
}

.recent-list-wrapper {
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-diffusion);
  overflow: hidden;
}

// 响应式
@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .bento-grid {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .metric-value {
    font-size: 22px;
  }

  .balance-value {
    font-size: 26px;
  }
}
</style>
