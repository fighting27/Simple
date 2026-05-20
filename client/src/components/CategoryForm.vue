<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="80px"
  >
    <el-form-item label="类型">
      <el-tag :type="type === 'income' ? 'success' : 'danger'">
        {{ type === 'income' ? '收入' : '支出' }}
      </el-tag>
    </el-form-item>

    <el-form-item label="名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="20" />
    </el-form-item>

    <el-form-item label="图标" prop="icon">
      <el-select v-model="form.icon" placeholder="选择图标（可选）" clearable style="width: 100%">
        <el-option
          v-for="icon in iconOptions"
          :key="icon"
          :label="icon"
          :value="icon"
        >
          <el-icon><component :is="icon" /></el-icon>
          <span style="margin-left: 8px">{{ icon }}</span>
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="排序" prop="sort_order">
      <el-input-number v-model="form.sort_order" :min="0" :max="999" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ isEdit ? '保存修改' : '创建分类' }}
      </el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useCategoryStore } from '@/stores/category'

const props = defineProps({
  initialData: { type: Object, default: null },
  isEdit: { type: Boolean, default: false },
  type: { type: String, default: 'expense' },
})

const emit = defineEmits(['success', 'cancel'])

const categoryStore = useCategoryStore()

const formRef = ref(null)
const loading = ref(false)

const form = ref({
  name: '',
  icon: '',
  sort_order: 0,
})

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

const iconOptions = [
  'Dish', 'Van', 'ShoppingBag', 'House', 'Film',
  'Money', 'Present', 'TrendCharts', 'Wallet', 'CreditCard',
  'Gift', 'Coffee', 'Phone', 'Car', 'Plane',
  'Book', 'Game', 'Music', 'Heart', 'Star',
]

watch(() => props.initialData, (val) => {
  if (val) {
    form.value = {
      name: val.name,
      icon: val.icon || '',
      sort_order: val.sort_order || 0,
    }
  }
}, { immediate: true })

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    if (props.isEdit) {
      await categoryStore.editCategory(props.initialData.id, form.value)
    } else {
      await categoryStore.addCategory({
        ...form.value,
        type: props.type,
      })
    }
    emit('success')
  } finally {
    loading.value = false
  }
}
</script>
