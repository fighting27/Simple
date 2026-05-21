<template>
  <div class="charts-page stagger-item" style="--index: 0">
    <div class="page-header">
      <h2>图表分析</h2>
      <p>可视化您的收支数据</p>
    </div>

    <!-- 图表网格 -->
    <div class="charts-grid">
      <!-- 月度趋势 -->
      <div class="card chart-card">
        <div class="card-header">
          <h3>月度趋势</h3>
          <select v-model="trendYear" class="year-select" @change="loadTrend">
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
          </select>
        </div>
        <TrendChart :data="trend" />
      </div>

      <!-- 分类占比 -->
      <div class="card chart-card">
        <div class="card-header">
          <h3>分类占比</h3>
          <div class="type-switch">
            <button
              :class="{ active: categoryType === 'expense' }"
              @click="categoryType = 'expense'; loadCategoryStats()"
            >支出</button>
            <button
              :class="{ active: categoryType === 'income' }"
              @click="categoryType = 'income'; loadCategoryStats()"
            >收入</button>
          </div>
        </div>
        <PieChart :data="categoryStats" :type="categoryType" />
      </div>

      <!-- 年度统计 -->
      <div class="card chart-card full-width">
        <div class="card-header">
          <h3>年度消费趋势</h3>
          <select v-model="yearlyYear" class="year-select" @change="loadYearly">
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
          </select>
        </div>
        <YearChart :data="yearly" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useStatisticsStore } from '@/stores/statistics'
import dayjs from 'dayjs'
import TrendChart from '@/components/TrendChart.vue'
import PieChart from '@/components/PieChart.vue'
import YearChart from '@/components/YearChart.vue'

const statisticsStore = useStatisticsStore()

const { trend, categoryStats, yearly } = storeToRefs(statisticsStore)

const currentYear = dayjs().year()
const trendYear = ref(currentYear)
const yearlyYear = ref(currentYear)
const categoryType = ref('expense')

const yearOptions = [currentYear - 2, currentYear - 1, currentYear]

onMounted(() => {
  loadTrend()
  loadCategoryStats()
  loadYearly()
})

function loadTrend() {
  statisticsStore.fetchTrend(trendYear.value)
}

function loadCategoryStats() {
  statisticsStore.fetchCategoryStats({ type: categoryType.value })
}

function loadYearly() {
  statisticsStore.fetchYearly(yearlyYear.value)
}
</script>

<style lang="scss" scoped>
.page-header {
  margin-bottom: 32px;

  h2 {
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
    letter-spacing: -0.04em;
    line-height: 1.2;
  }

  p {
    font-size: 14px;
    color: var(--text-muted);
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

.chart-card {
  &.full-width {
    grid-column: 1 / -1;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }
}

.year-select {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-card);
  cursor: pointer;
  transition: var(--transition);
  font-family: var(--font-sans);

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--border-focus);
  }
}

.type-switch {
  display: flex;
  background: var(--bg-hover);
  border-radius: var(--radius-xs);
  padding: 3px;

  button {
    padding: 6px 14px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    transition: var(--transition);
    cursor: pointer;

    &.active {
      background: var(--bg-card);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
    }
  }
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card.full-width {
    grid-column: auto;
  }
}
</style>
