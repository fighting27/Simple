import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '@/api/transaction'
import { ElMessage } from 'element-plus'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref([])
  const total = ref(0)
  const loading = ref(false)

  // 当前筛选参数
  const filters = ref({
    page: 1,
    page_size: 20,
    type: '',
    category_id: '',
    start_date: '',
    end_date: '',
    keyword: '',
  })

  // 获取交易列表
  async function fetchTransactions(params = null) {
    loading.value = true
    try {
      // 如果传了新参数，更新筛选条件
      if (params !== null) {
        filters.value = { ...filters.value, ...params }
      }

      // 构建查询参数，只包含有值的字段
      const query = {
        page: filters.value.page || 1,
        page_size: filters.value.page_size || 20,
      }

      if (filters.value.type) query.type = filters.value.type
      if (filters.value.category_id) query.category_id = filters.value.category_id
      if (filters.value.start_date) query.start_date = filters.value.start_date
      if (filters.value.end_date) query.end_date = filters.value.end_date
      if (filters.value.keyword) query.keyword = filters.value.keyword

      const res = await getTransactions(query)
      transactions.value = res.data.list
      total.value = res.data.pagination.total
    } finally {
      loading.value = false
    }
  }

  // 创建交易
  async function addTransaction(data) {
    await createTransaction(data)
    ElMessage.success('创建成功')
    await fetchTransactions()
  }

  // 更新交易
  async function editTransaction(id, data) {
    await updateTransaction(id, data)
    ElMessage.success('更新成功')
    await fetchTransactions()
  }

  // 删除交易
  async function removeTransaction(id) {
    await deleteTransaction(id)
    ElMessage.success('删除成功')
    await fetchTransactions()
  }

  // 设置页码
  function setPage(page) {
    fetchTransactions({ page })
  }

  // 重置筛选
  function resetFilters() {
    filters.value = {
      page: 1,
      page_size: 20,
      type: '',
      category_id: '',
      start_date: '',
      end_date: '',
      keyword: '',
    }
    fetchTransactions()
  }

  return {
    transactions,
    total,
    loading,
    filters,
    fetchTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
    setPage,
    resetFilters,
  }
})
