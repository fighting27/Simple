<template>
  <div class="category-page stagger-item" style="--index: 0">
    <div class="page-header">
      <div>
        <h2>分类管理</h2>
        <p>管理收入和支出分类</p>
      </div>
    </div>

    <div class="category-grid">
      <!-- 支出分类 -->
      <div class="card">
        <div class="card-header">
          <h3>
            <span class="type-dot expense"></span>
            支出分类
          </h3>
          <button class="add-btn expense" @click="showAddDialog('expense')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            新增
          </button>
        </div>
        <div class="category-list">
          <div
            v-for="cat in expenseCategories"
            :key="cat.id"
            class="category-item"
          >
            <div class="category-info">
              <span class="category-name">{{ cat.name }}</span>
              <span v-if="cat.is_default" class="default-tag">默认</span>
            </div>
            <div class="category-actions">
              <button class="action-btn" @click="showEditDialog(cat)">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 1.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button v-if="!cat.is_default" class="action-btn delete" @click="handleDelete(cat)">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5 4V2.5h4V4M3.5 4l.5 8h6l.5-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="expenseCategories.length === 0" class="empty-hint">暂无分类</div>
        </div>
      </div>

      <!-- 收入分类 -->
      <div class="card">
        <div class="card-header">
          <h3>
            <span class="type-dot income"></span>
            收入分类
          </h3>
          <button class="add-btn income" @click="showAddDialog('income')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            新增
          </button>
        </div>
        <div class="category-list">
          <div
            v-for="cat in incomeCategories"
            :key="cat.id"
            class="category-item"
          >
            <div class="category-info">
              <span class="category-name">{{ cat.name }}</span>
              <span v-if="cat.is_default" class="default-tag">默认</span>
            </div>
            <div class="category-actions">
              <button class="action-btn" @click="showEditDialog(cat)">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 1.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button v-if="!cat.is_default" class="action-btn delete" @click="handleDelete(cat)">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5 4V2.5h4V4M3.5 4l.5 8h6l.5-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="incomeCategories.length === 0" class="empty-hint">暂无分类</div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="400px"
      destroy-on-close
    >
      <CategoryForm
        :initial-data="currentCategory"
        :is-edit="isEdit"
        :type="currentType"
        @success="handleFormSuccess"
        @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { ElMessageBox } from 'element-plus'
import CategoryForm from '@/components/CategoryForm.vue'

const categoryStore = useCategoryStore()

const { expenseCategories, incomeCategories } = categoryStore

const dialogVisible = ref(false)
const isEdit = ref(false)
const currentCategory = ref(null)
const currentType = ref('expense')

onMounted(() => {
  categoryStore.fetchCategories()
})

function showAddDialog(type) {
  isEdit.value = false
  currentCategory.value = null
  currentType.value = type
  dialogVisible.value = true
}

function showEditDialog(cat) {
  isEdit.value = true
  currentCategory.value = { ...cat }
  currentType.value = cat.type
  dialogVisible.value = true
}

async function handleDelete(cat) {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${cat.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await categoryStore.removeCategory(cat.id)
  } catch {}
}

function handleFormSuccess() {
  dialogVisible.value = false
  categoryStore.fetchCategories()
}
</script>

<style lang="scss" scoped>
.page-header {
  margin-bottom: 32px;

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

.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    letter-spacing: -0.02em;
  }
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.expense { background: var(--expense); }
  &.income { background: var(--income); }
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-xs);
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
  background: transparent;

  &.expense {
    color: var(--expense);

    &:hover {
      background: #FEF2F2;
    }
  }

  &.income {
    color: var(--income);

    &:hover {
      background: var(--primary-bg);
    }
  }

  &:active {
    transform: scale(0.96);
  }
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-hover);
  border-radius: var(--radius-xs);
  transition: var(--transition);

  &:hover {
    background: var(--border-light);
  }
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.default-tag {
  padding: 2px 8px;
  background: var(--border-light);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
  border-radius: var(--radius-full);
}

.category-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: var(--transition);
}

.category-item:hover .category-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  background: transparent;
  transition: var(--transition);
  cursor: pointer;

  &:hover {
    background: var(--bg-card);
    color: var(--text-secondary);
  }

  &.delete:hover {
    color: var(--expense);
  }

  &:active {
    transform: scale(0.9);
  }
}

.empty-hint {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>
