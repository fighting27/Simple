<template>
  <div class="transaction-form">
    <!-- 类型切换 -->
    <div class="type-switch">
      <button
        :class="{ active: form.type === 'expense' }"
        @click="handleTypeChange('expense')"
      >
        <span class="type-dot expense"></span>
        支出
      </button>
      <button
        :class="{ active: form.type === 'income' }"
        @click="handleTypeChange('income')"
      >
        <span class="type-dot income"></span>
        收入
      </button>
    </div>

    <!-- 金额输入 -->
    <div class="amount-input">
      <span class="currency">¥</span>
      <input
        v-model.number="form.amount"
        type="number"
        placeholder="0.00"
        step="0.01"
        min="0.01"
      />
    </div>

    <!-- 分类选择 -->
    <div class="form-field">
      <label>分类</label>
      <div class="category-grid">
        <button
          v-for="cat in currentCategories"
          :key="cat.id"
          :class="{ active: form.category_id === cat.id }"
          @click="form.category_id = cat.id"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- 日期和备注 -->
    <div class="form-row">
      <div class="form-field">
        <label>日期</label>
        <input v-model="form.transaction_date" type="date" class="date-input" />
      </div>
      <div class="form-field">
        <label>备注</label>
        <input v-model="form.note" type="text" class="note-input" placeholder="添加备注（可选）" />
      </div>
    </div>

    <!-- 提交按钮 -->
    <button class="submit-btn" @click="handleSubmit" :disabled="loading">
      {{ loading ? '提交中...' : (isEdit ? '保存修改' : '添加记录') }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { useTransactionStore } from '@/stores/transaction'
import dayjs from 'dayjs'

const props = defineProps({
  initialData: { type: Object, default: null },
  isEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['success', 'cancel'])

const categoryStore = useCategoryStore()
const transactionStore = useTransactionStore()

const loading = ref(false)

const form = ref({
  type: 'expense',
  amount: 0,
  category_id: '',
  transaction_date: dayjs().format('YYYY-MM-DD'),
  note: '',
})

const currentCategories = computed(() => {
  return form.value.type === 'income'
    ? categoryStore.incomeCategories
    : categoryStore.expenseCategories
})

watch(() => props.initialData, (val) => {
  if (val) {
    form.value = {
      type: val.type,
      amount: val.amount,
      category_id: val.category_id,
      transaction_date: val.transaction_date,
      note: val.note || '',
    }
  }
}, { immediate: true })

function handleTypeChange(type) {
  form.value.type = type
  form.value.category_id = ''
}

async function handleSubmit() {
  if (!form.value.amount || form.value.amount <= 0) {
    return
  }
  if (!form.value.category_id) {
    return
  }

  loading.value = true
  try {
    if (props.isEdit) {
      await transactionStore.editTransaction(props.initialData.id, form.value)
    } else {
      await transactionStore.addTransaction(form.value)
    }
    emit('success')

    if (!props.isEdit) {
      form.value = {
        type: 'expense',
        amount: 0,
        category_id: '',
        transaction_date: dayjs().format('YYYY-MM-DD'),
        note: '',
      }
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.type-switch {
  display: flex;
  background: var(--bg-hover);
  border-radius: var(--radius-xs);
  padding: 4px;

  button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
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

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.expense { background: var(--expense); }
  &.income { background: var(--income); }
}

.amount-input {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 16px 20px;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);

  .currency {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  input {
    flex: 1;
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    background: transparent;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;

    &::placeholder {
      color: var(--text-placeholder);
    }

    &:focus {
      outline: none;
    }
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    padding: 7px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-xs);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--bg-card);
    transition: var(--transition);
    cursor: pointer;

    &:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    &.active {
      border-color: var(--primary);
      background: var(--primary-bg);
      color: var(--primary-dark);
    }

    &:active {
      transform: scale(0.96);
    }
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.date-input, .note-input {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-card);
  transition: var(--transition);
  font-family: var(--font-sans);

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--border-focus);
  }

  &::placeholder {
    color: var(--text-placeholder);
  }
}

.submit-btn {
  padding: 14px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition);
  cursor: pointer;

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}
</style>
