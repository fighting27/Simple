import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'
import { ElMessage } from 'element-plus'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([])
  const expenseCategories = ref([])
  const incomeCategories = ref([])
  const loading = ref(false)

  // 获取所有分类
  async function fetchCategories() {
    loading.value = true
    try {
      const res = await getCategories()
      categories.value = res.data
      expenseCategories.value = res.data.filter(c => c.type === 'expense')
      incomeCategories.value = res.data.filter(c => c.type === 'income')
    } finally {
      loading.value = false
    }
  }

  // 创建分类
  async function addCategory(data) {
    await createCategory(data)
    ElMessage.success('创建成功')
    await fetchCategories()
  }

  // 更新分类
  async function editCategory(id, data) {
    await updateCategory(id, data)
    ElMessage.success('更新成功')
    await fetchCategories()
  }

  // 删除分类
  async function removeCategory(id) {
    await deleteCategory(id)
    ElMessage.success('删除成功')
    await fetchCategories()
  }

  return {
    categories,
    expenseCategories,
    incomeCategories,
    loading,
    fetchCategories,
    addCategory,
    editCategory,
    removeCategory,
  }
})
