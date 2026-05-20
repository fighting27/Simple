<template>
  <div class="budget-alert">
    <el-alert
      :title="alertTitle"
      :description="alertDesc"
      type="warning"
      show-icon
      :closable="false"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatAmount } from '@/utils/format'

const props = defineProps({
  info: { type: Object, required: true },
})

const alertTitle = computed(() => {
  return `本月支出已超预算！`
})

const alertDesc = computed(() => {
  const { budget, spent, percentage } = props.info
  return `预算 ${formatAmount(budget)}，已支出 ${formatAmount(spent)}（${percentage}%）`
})
</script>

<style lang="scss" scoped>
.budget-alert {
  margin-bottom: 24px;
}
</style>
