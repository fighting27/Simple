<template>
  <div class="transaction-page">
    <div class="page-header">
      <div>
        <h2>收支记录</h2>
        <p>管理您的每一笔收支</p>
      </div>
      <button class="primary-btn" @click="showAddDialog">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        新增记录
      </button>
    </div>

    <!-- 筛选栏 -->
    <div class="card filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <label>类型</label>
          <select v-model="filterForm.type" class="filter-select" @change="handleSearch">
            <option value="">全部</option>
            <option value="income">收入</option>
            <option value="expense">支出</option>
          </select>
        </div>

        <div class="filter-item">
          <label>分类</label>
          <select v-model="filterForm.category_id" class="filter-select" @change="handleSearch">
            <option value="">全部</option>
            <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="filter-item">
          <label>日期</label>
          <div class="date-range">
            <input v-model="filterForm.start_date" type="date" class="filter-input date" @change="handleSearch" />
            <span class="date-sep">至</span>
            <input v-model="filterForm.end_date" type="date" class="filter-input date" @change="handleSearch" />
          </div>
        </div>

        <div class="filter-item">
          <label>搜索</label>
          <input
            v-model="filterForm.keyword"
            type="text"
            class="filter-input"
            placeholder="备注或分类"
            @input="handleSearch"
          />
        </div>

        <button class="filter-btn" @click="handleSearch">搜索</button>
        <button class="filter-reset" @click="handleReset">重置</button>
      </div>
    </div>

    <!-- 记录列表 -->
    <div class="card">
      <TransactionList
        :transactions="transactions"
        :total="total"
        :show-pagination="true"
        @edit="handleEdit"
        @delete="handleDelete"
        @page-change="handlePageChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑记录' : '新增记录'"
      width="460px"
      destroy-on-close
    >
      <TransactionForm
        :initial-data="currentTransaction"
        :is-edit="isEdit"
        @success="handleFormSuccess"
        @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTransactionStore } from '@/stores/transaction'
import { useCategoryStore } from '@/stores/category'
import { ElMessageBox } from 'element-plus'
import TransactionList from '@/components/TransactionList.vue'
import TransactionForm from '@/components/TransactionForm.vue'

const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()

const { transactions, total } = storeToRefs(transactionStore)

const dialogVisible = ref(false)
const isEdit = ref(false)
const currentTransaction = ref(null)

const filterForm = ref({
  type: '',
  category_id: '',
  keyword: '',
  start_date: '',
  end_date: '',
})

// 防抖定时器
let searchTimer = null

const filteredCategories = computed(() => {
  if (filterForm.value.type) {
    return categoryStore.categories.filter(c => c.type === filterForm.value.type)
  }
  return categoryStore.categories
})

onMounted(() => {
  transactionStore.fetchTransactions()
})

// 立即筛选（类型、分类、日期）
function handleSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    transactionStore.fetchTransactions({
      page: 1,
      type: filterForm.value.type,
      category_id: filterForm.value.category_id ? Number(filterForm.value.category_id) : '',
      keyword: filterForm.value.keyword,
      start_date: filterForm.value.start_date,
      end_date: filterForm.value.end_date,
    })
  }, 300)
}

function handleReset() {
  if (searchTimer) clearTimeout(searchTimer)
  filterForm.value = { type: '', category_id: '', keyword: '', start_date: '', end_date: '' }
  transactionStore.resetFilters()
}

function showAddDialog() {
  isEdit.value = false
  currentTransaction.value = null
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  currentTransaction.value = { ...row }
  dialogVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await transactionStore.removeTransaction(row.id)
  } catch {}
}

function handleFormSuccess() {
  dialogVisible.value = false
  transactionStore.fetchTransactions()
}

function handlePageChange(page) {
  transactionStore.setPage(page)
}
</script>

<style lang="scss" scoped>
.transaction-page {
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

.primary-btn {
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

// 筛选栏 - 紧凑工具条
.filter-bar {
  margin-bottom: 20px;
  padding: 20px 24px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}

.filter-select, .filter-input {
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-card);
  transition: var(--transition);
  min-width: 120px;
  font-family: var(--font-sans);

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--border-focus);
  }

  &::placeholder {
    color: var(--text-placeholder);
  }

  &.date {
    min-width: 120px;
  }
}

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-sep {
  color: var(--text-muted);
  font-size: 12px;
}

.filter-btn {
  padding: 7px 14px;
  background: var(--primary);
  color: white;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-xs);
  transition: var(--transition);
  cursor: pointer;

  &:hover {
    background: var(--primary-dark);
  }

  &:active {
    transform: scale(0.98);
  }
}

.filter-reset {
  padding: 7px 14px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-xs);
  transition: var(--transition);

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
}
</style>
