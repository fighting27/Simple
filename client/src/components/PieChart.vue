<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Array, default: () => [] },
  type: { type: String, default: 'expense' },
})

const chartRef = ref(null)
let chart = null

const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

watch(() => [props.data, props.type], () => {
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
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      borderRadius: 12,
      padding: [12, 16],
      textStyle: { color: '#0F172A', fontSize: 13 },
      formatter: (p) => `${p.name}：¥${p.value.toFixed(2)}（${p.percent}%）`,
    },
    legend: {
      orient: 'horizontal',
      bottom: 8,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,
      textStyle: { color: '#475569', fontSize: 12 },
    },
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 3,
      },
      label: {
        show: false,
      },
      emphasis: {
        scaleSize: 6,
        itemStyle: {
          shadowBlur: 12,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
        },
      },
      data: props.data.map((d, i) => ({
        name: d.category_name,
        value: d.total_amount,
        itemStyle: { color: colors[i % colors.length] },
      })),
    }],
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
