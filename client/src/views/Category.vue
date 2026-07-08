<template>
  <div class="category-page stagger-item" style="--index: 0">
    <div class="page-header">
      <div>
        <h2>分类管理</h2>
        <p>管理收入和支出分类</p>
      </div>
    </div>

    <div class="category-grid">
      <div v-for="section in categorySections" :key="section.type" class="card">
        <div class="card-header">
          <h3>
            <span class="type-dot" :class="section.type"></span>
            {{ section.title }}
          </h3>
          <button class="add-btn" :class="section.type" @click="showAddDialog(section.type)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            新增
          </button>
        </div>

        <div class="category-list" :class="{ 'is-drag-active': dragState.active && dragState.type === section.type }">
          <div
            v-for="(cat, index) in section.items"
            :key="cat.id"
            class="category-item"
            :class="{
              'is-dragging': dragState.active && dragState.type === section.type && dragState.id === cat.id,
              'is-drop-target': dragState.active && dragState.type === section.type && dragState.currentIndex === index,
            }"
            :data-drag-type="section.type"
            :data-index="index"
            @pointerdown="handlePointerDown($event, section.type, index, cat)"
          >
            <div class="category-info">
              <span class="drag-handle" aria-hidden="true">
                <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                  <path d="M3 3h.01M3 8h.01M3 13h.01M9 3h.01M9 8h.01M9 13h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                </svg>
              </span>
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
          <div v-if="section.items.length === 0" class="empty-hint">暂无分类</div>
        </div>
      </div>
    </div>

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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCategoryStore } from '@/stores/category'
import { ElMessageBox } from 'element-plus'
import CategoryForm from '@/components/CategoryForm.vue'

const categoryStore = useCategoryStore()
const { expenseCategories, incomeCategories } = storeToRefs(categoryStore)

const dialogVisible = ref(false)
const isEdit = ref(false)
const currentCategory = ref(null)
const currentType = ref('expense')
const orderedExpenseCategories = ref([])
const orderedIncomeCategories = ref([])
const dragState = ref({
  active: false,
  type: '',
  id: null,
  fromIndex: -1,
  currentIndex: -1,
})

const categorySections = computed(() => [
  { type: 'expense', title: '支出分类', items: orderedExpenseCategories.value },
  { type: 'income', title: '收入分类', items: orderedIncomeCategories.value },
])

let pressTimer = null
let pendingDrag = null
const longPressDelay = 420
const moveTolerance = 8

watch(expenseCategories, (list) => {
  if (dragState.value.type !== 'expense') orderedExpenseCategories.value = [...list]
}, { immediate: true })

watch(incomeCategories, (list) => {
  if (dragState.value.type !== 'income') orderedIncomeCategories.value = [...list]
}, { immediate: true })

onMounted(() => {
  categoryStore.fetchCategories()
})

onBeforeUnmount(() => {
  clearDragListeners()
})

function getListRef(type) {
  return type === 'expense' ? orderedExpenseCategories : orderedIncomeCategories
}

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
    await ElMessageBox.confirm(`确定要删除分类 "${cat.name}" 吗？`, '提示', {
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

function handlePointerDown(event, type, index, cat) {
  if (event.button !== undefined && event.button !== 0) return
  if (event.target.closest('.category-actions')) return

  clearPressTimer()
  pendingDrag = {
    type,
    index,
    id: cat.id,
    startX: event.clientX,
    startY: event.clientY,
  }

  window.addEventListener('pointermove', handlePendingMove)
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('pointercancel', handlePointerCancel)

  pressTimer = window.setTimeout(() => {
    beginDrag()
  }, longPressDelay)
}

function handlePendingMove(event) {
  if (!pendingDrag || dragState.value.active) return
  const dx = Math.abs(event.clientX - pendingDrag.startX)
  const dy = Math.abs(event.clientY - pendingDrag.startY)
  if (dx > moveTolerance || dy > moveTolerance) {
    clearDragListeners()
  }
}

function beginDrag() {
  if (!pendingDrag) return
  dragState.value = {
    active: true,
    type: pendingDrag.type,
    id: pendingDrag.id,
    fromIndex: pendingDrag.index,
    currentIndex: pendingDrag.index,
  }
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', handlePointerMove)
}

function handlePointerMove(event) {
  if (!dragState.value.active) return
  event.preventDefault()

  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.category-item[data-drag-type]')
  if (!target || target.dataset.dragType !== dragState.value.type) return

  const nextIndex = Number(target.dataset.index)
  if (!Number.isInteger(nextIndex) || nextIndex === dragState.value.currentIndex) return

  const listRef = getListRef(dragState.value.type)
  const nextList = [...listRef.value]
  const currentIndex = nextList.findIndex(item => item.id === dragState.value.id)
  if (currentIndex < 0) return

  const [moved] = nextList.splice(currentIndex, 1)
  nextList.splice(nextIndex, 0, moved)
  listRef.value = nextList
  dragState.value.currentIndex = nextIndex
}

async function handlePointerUp() {
  const finishedDrag = { ...dragState.value }
  const shouldPersist = finishedDrag.active && finishedDrag.fromIndex !== finishedDrag.currentIndex
  const type = finishedDrag.type

  clearDragListeners()

  if (!shouldPersist) return

  try {
    const ids = getListRef(type).value.map(category => category.id)
    await categoryStore.reorderCategoryList(type, ids)
  } catch {
    await categoryStore.fetchCategories()
  }
}

function handlePointerCancel() {
  clearDragListeners()
  orderedExpenseCategories.value = [...expenseCategories.value]
  orderedIncomeCategories.value = [...incomeCategories.value]
}

function clearPressTimer() {
  if (pressTimer) {
    window.clearTimeout(pressTimer)
    pressTimer = null
  }
}

function clearDragListeners() {
  clearPressTimer()
  pendingDrag = null
  dragState.value = { active: false, type: '', id: null, fromIndex: -1, currentIndex: -1 }
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', handlePendingMove)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('pointercancel', handlePointerCancel)
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
  cursor: grab;
  touch-action: pan-y;

  &:hover {
    background: var(--border-light);
  }

  &.is-dragging {
    cursor: grabbing;
    opacity: 0.82;
    background: var(--bg-card);
    outline: 2px solid var(--border-focus);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  }

  &.is-drop-target:not(.is-dragging) {
    outline: 2px solid var(--border-focus);
  }
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.drag-handle {
  width: 14px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  opacity: 0.95;
  flex: 0 0 14px;
}

.category-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.default-tag {
  padding: 2px 8px;
  background: var(--border-light);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
  border-radius: var(--radius-full);
  flex-shrink: 0;
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
