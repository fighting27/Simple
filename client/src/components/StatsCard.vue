<template>
  <div class="stat-card">
    <div class="stat-icon" :style="{ background: iconBg, color: iconColor }">
      <el-icon size="24"><component :is="icon" /></el-icon>
    </div>
    <div class="stat-info">
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value" :class="valueClass">{{ formattedValue }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatAmount } from '@/utils/format'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, default: 0 },
  icon: { type: String, default: 'DataBoard' },
  iconBg: { type: String, default: '#ecf5ff' },
  iconColor: { type: String, default: '#409eff' },
  prefix: { type: String, default: '' },
  isBalance: { type: Boolean, default: false },
})

const formattedValue = computed(() => {
  if (props.prefix) {
    return `${props.prefix}${formatAmount(props.value)}`
  }
  return formatAmount(props.value)
})

const valueClass = computed(() => {
  if (props.isBalance) {
    return props.value >= 0 ? 'income-color' : 'expense-color'
  }
  return ''
})
</script>

<style lang="scss" scoped>
.stat-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;

    &.income-color { color: #67c23a; }
    &.expense-color { color: #f56c6c; }
  }
}
</style>
