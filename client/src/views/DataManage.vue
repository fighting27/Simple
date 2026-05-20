<template>
  <div class="data-page">
    <div class="page-header">
      <h2>数据管理</h2>
      <p>导入导出和备份恢复</p>
    </div>

    <div class="data-grid">
      <!-- Excel 导入导出 -->
      <div class="card">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#10B981" fill-opacity="0.1"/>
            <path d="M8 8h8M8 12h8M8 16h5" stroke="#10B981" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3>Excel 导入导出</h3>
        <p class="desc">支持 .xlsx 格式的收支记录导入导出</p>
        <div class="actions">
          <button class="btn-primary" @click="handleExportExcel">导出 Excel</button>
          <label class="btn-outline">
            导入 Excel
            <input type="file" accept=".xlsx,.xls" @change="handleImportExcel" hidden />
          </label>
        </div>
      </div>

      <!-- JSON 备份恢复 -->
      <div class="card">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#3B82F6" fill-opacity="0.1"/>
            <path d="M8 12h8M12 8v8" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3>JSON 备份恢复</h3>
        <p class="desc">完整的数据备份，包含所有记录、分类和设置</p>
        <div class="actions">
          <button class="btn-primary" @click="handleExportJson">导出 JSON</button>
          <label class="btn-outline">
            导入 JSON
            <input type="file" accept=".json" @change="handleImportJson" hidden />
          </label>
        </div>
      </div>

      <!-- 本地备份 -->
      <div class="card">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#8B5CF6" fill-opacity="0.1"/>
            <path d="M12 8v8M8 12h8" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3>本地备份</h3>
        <p class="desc">创建本地备份快照，可随时恢复</p>
        <div class="actions">
          <button class="btn-primary" @click="handleCreateBackup" :disabled="backupLoading">
            {{ backupLoading ? '创建中...' : '创建备份' }}
          </button>
        </div>
      </div>

      <!-- 备份记录 -->
      <div class="card full-width">
        <h3>备份记录</h3>
        <div v-if="backupList.length === 0" class="empty-hint">暂无备份记录</div>
        <div v-else class="backup-list">
          <div v-for="item in backupList" :key="item.id" class="backup-item">
            <div class="backup-info">
              <span class="backup-name">{{ item.filename }}</span>
              <span class="backup-meta">
                {{ formatFileSize(item.file_size) }} · {{ formatDateTime(item.created_at) }}
              </span>
            </div>
            <button
              v-if="item.type === 'json'"
              class="btn-text"
              @click="handleRestore(item)"
            >恢复</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { exportExcel, importExcel, exportJson, importJson, createBackup, getBackupList, restoreBackup } from '@/api/backup'
import { formatFileSize, formatDateTime } from '@/utils/format'

const backupList = ref([])
const backupLoading = ref(false)

onMounted(() => {
  loadBackupList()
})

async function loadBackupList() {
  const res = await getBackupList()
  backupList.value = res.data
}

async function handleExportExcel() {
  try {
    const res = await exportExcel()
    downloadBlob(res, '记账数据.xlsx')
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

async function handleImportExcel(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    await importExcel(file)
    ElMessage.success('导入成功')
  } catch {
    ElMessage.error('导入失败')
  }
  e.target.value = ''
}

async function handleExportJson() {
  try {
    const res = await exportJson()
    downloadBlob(res, '备份数据.json')
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

async function handleImportJson(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    await ElMessageBox.confirm('导入将覆盖现有数据，确定继续吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await importJson(file)
    ElMessage.success('导入成功')
  } catch {}
  e.target.value = ''
}

async function handleCreateBackup() {
  backupLoading.value = true
  try {
    await createBackup()
    ElMessage.success('备份创建成功')
    await loadBackupList()
  } catch {
    ElMessage.error('备份创建失败')
  } finally {
    backupLoading.value = false
  }
}

async function handleRestore(row) {
  try {
    await ElMessageBox.confirm('恢复备份将覆盖现有数据，确定继续吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await restoreBackup(row.id)
    ElMessage.success('恢复成功')
  } catch {}
}

function downloadBlob(data, filename) {
  const blob = new Blob([data], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style lang="scss" scoped>
.data-page {
  animation: fadeIn 0.5s var(--ease-spring);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

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

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card {
  &.full-width {
    grid-column: 1 / -1;
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 12px 0 4px;
    letter-spacing: -0.02em;
  }
}

.card-icon {
  margin-bottom: 4px;
}

.desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-primary {
  padding: 8px 16px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-xs);
  font-size: 13px;
  font-weight: 600;
  transition: var(--transition);
  cursor: pointer;

  &:hover {
    background: var(--primary-dark);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.btn-outline {
  padding: 8px 16px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &:active {
    transform: scale(0.98);
  }
}

.btn-text {
  padding: 4px 12px;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-xs);
  transition: var(--transition);
  cursor: pointer;

  &:hover {
    background: var(--primary-bg);
  }
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.backup-item {
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

.backup-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.backup-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.backup-meta {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.empty-hint {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 768px) {
  .data-grid {
    grid-template-columns: 1fr;
  }
}
</style>
