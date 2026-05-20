<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Object, default: () => ({}) },
})

const chartRef = ref(null)
let chart = null

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

function initChart() {
  chart = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chart || !props.data.monthly) return

  const monthly = props.data.monthly

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      borderRadius: 12,
      padding: [12, 16],
      textStyle: { color: '#0F172A', fontSize: 13 },
      formatter: (params) => {
        let html = `<div style="font-weight:600;margin-bottom:8px;font-size:14px">${params[0].axisValue}</div>`
        params.forEach(p => {
          html += `<div style="display:flex;align-items:center;gap:8px;margin:6px 0">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
            <span style="color:#6B7280">${p.seriesName}</span>
            <span style="font-weight:600;margin-left:auto">¥${p.value.toFixed(2)}</span>
          </div>`
        })
        return html
      },
    },
    legend: {
      show: false,
    },
    grid: {
      left: 50,
      right: 16,
      top: 16,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: monthly.map(d => d.month),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94A3B8', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      axisLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        formatter: (v) => v >= 1000 ? (v / 1000) + 'k' : v,
      },
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: monthly.map(d => d.income),
        barWidth: 16,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#10B981' },
            { offset: 1, color: '#34D399' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '支出',
        type: 'bar',
        data: monthly.map(d => d.expense),
        barWidth: 16,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#EF4444' },
            { offset: 1, color: '#F87171' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '结余',
        type: 'line',
        data: monthly.map(d => d.balance),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#3B82F6' },
        itemStyle: { color: '#3B82F6' },
        emphasis: {
          focus: 'series',
          itemStyle: { borderWidth: 2, borderColor: '#fff' },
        },
      },
    ],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }

  chart.setOption(option, true)
}

function handleResize() {
  chart?.resize()
}
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 300px;
}
</style>
