<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Array, default: () => [] },
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
  if (!chart || !props.data.length) return

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
      data: props.data.map(d => d.month),
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
        type: 'line',
        data: props.data.map(d => d.income),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#10B981' },
        itemStyle: { color: '#10B981' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.15)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.01)' },
          ]),
        },
        emphasis: {
          focus: 'series',
          itemStyle: { borderWidth: 2, borderColor: '#fff' },
        },
      },
      {
        name: '支出',
        type: 'line',
        data: props.data.map(d => d.expense),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#EF4444' },
        itemStyle: { color: '#EF4444' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.15)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.01)' },
          ]),
        },
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
  height: 280px;
}
</style>
