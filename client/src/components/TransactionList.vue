<template>
  <div class="transaction-list">
    <div v-if="transactions.length === 0 && !loading" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="#F3F4F6"/>
        <path d="M16 20h16M16 24h16M16 28h10" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p>暂无记录</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="clean-table">
        <thead>
          <tr>
            <th>类型</th>
            <th>金额</th>
            <th>分类</th>
            <th>备注</th>
            <th>日期</th>
            <th v-if="showActions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in transactions" :key="row.id" class="table-row">
            <td>
              <span class="type-tag" :class="row.type">
                {{ row.type === 'income' ? '收入' : '支出' }}
              </span>
            </td>
            <td>
              <span class="amount" :class="row.type">
                {{ row.type === 'income' ? '+' : '-' }}{{ formatAmount(row.amount) }}
              </span>
            </td>
            <td>
              <div class="category-cell">
                <span class="category-name">{{ row.category_name }}</span>
              </div>
            </td>
            <td>
              <span class="note-text">{{ row.note || '-' }}</span>
            </td>
            <td>
              <span class="date-text">{{ formatDate(row.transaction_date) }}</span>
            </td>
            <td v-if="showActions">
              <div class="action-btns">
                <button class="action-btn edit" @click="$emit('edit', row)">编辑</button>
                <button class="action-btn delete" @click="$emit('delete', row)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination && total > 0" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="20"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { formatAmount, formatDate } from '@/utils/format'

const props = defineProps({
  transactions: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  showPagination: { type: Boolean, default: false },
  showActions: { type: Boolean, default: true },
})

const emit = defineEmits(['edit', 'delete', 'page-change'])

const currentPage = ref(1)

function handlePageChange(page) {
  currentPage.value = page
  emit('page-change', page)
}
</script>

<style lang="scss" scoped>
.transaction-list {
  width: 100%;
}

.table-wrapper {
  overflow-x: auto;
}

.clean-table {
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 14px 16px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid var(--border-light);
  }

  td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-light);
  }

  .table-row {
    transition: var(--transition);

    &:hover {
      background: var(--bg-hover);
    }

    &:last-child td {
      border-bottom: none;
    }
  }
}

.type-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;

  &.income {
    background: var(--primary-bg);
    color: var(--primary-dark);
  }

  &.expense {
    background: #FEF2F2;
    color: #DC2626;
  }
}

.amount {
  font-weight: 700;
  font-size: 14px;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;

  &.income { color: var(--income); }
  &.expense { color: var(--expense); }
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-name {
  font-size: 13px;
  color: var(--text-primary);
}

.note-text {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-text {
  font-size: 13px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.action-btns {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: var(--transition);
}

.table-row:hover .action-btns {
  opacity: 1;
}

.action-btn {
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  font-size: 12px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
  background: transparent;

  &.edit {
    color: var(--primary);

    &:hover {
      background: var(--primary-bg);
    }
  }

  &.delete {
    color: var(--expense);

    &:hover {
      background: #FEF2F2;
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: var(--text-muted);

  p {
    margin-top: 16px;
    font-size: 13px;
  }
}
</style>
