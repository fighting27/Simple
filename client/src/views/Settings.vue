<template>
  <div class="settings-page">
    <div class="page-header">
      <h2>设置</h2>
      <p>个性化您的记账本</p>
    </div>

    <div class="card">
      <div class="setting-group">
        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">用户昵称</span>
            <span class="label-desc">显示在首页的称呼</span>
          </div>
          <input v-model="form.nickname" type="text" class="setting-input" placeholder="请输入昵称" />
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">月预算</span>
            <span class="label-desc">超过预算时会收到提醒</span>
          </div>
          <div class="input-with-unit">
            <input v-model.number="form.monthly_budget" type="number" class="setting-input" placeholder="5000" />
            <span class="unit">元</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">超支提醒</span>
            <span class="label-desc">开启后，当月支出超过预算时会提醒</span>
          </div>
          <button
            class="toggle-btn"
            :class="{ active: form.budget_alert === '1' }"
            @click="form.budget_alert = form.budget_alert === '1' ? '0' : '1'"
          >
            <span class="toggle-thumb"></span>
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">数据路径</span>
            <span class="label-desc">数据库文件存储位置</span>
          </div>
          <span class="path-text">{{ form.data_path }}</span>
        </div>
      </div>

      <div class="setting-footer">
        <button class="btn-primary" @click="handleSave" :disabled="saving">
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSettingStore } from '@/stores/setting'
import { ElMessage } from 'element-plus'

const settingStore = useSettingStore()

const form = ref({
  nickname: '用户',
  monthly_budget: 5000,
  budget_alert: '1',
  data_path: '',
})

const saving = ref(false)

onMounted(async () => {
  await settingStore.fetchSettings()
  form.value = { ...settingStore.settings }
  form.value.monthly_budget = parseFloat(form.value.monthly_budget) || 5000
})

async function handleSave() {
  saving.value = true
  try {
    await settingStore.saveSettings({
      nickname: form.value.nickname,
      monthly_budget: form.value.monthly_budget,
      budget_alert: form.value.budget_alert,
    })
    ElMessage.success('设置已保存')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
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

.setting-group {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.label-desc {
  font-size: 13px;
  color: var(--text-muted);
}

.setting-input {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-card);
  transition: var(--transition);
  width: 200px;
  text-align: right;
  font-family: var(--font-sans);

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--border-focus);
  }
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 8px;

  .setting-input {
    width: 140px;
    font-family: var(--font-mono);
  }

  .unit {
    font-size: 13px;
    color: var(--text-muted);
  }
}

.path-text {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle-btn {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: var(--border);
  position: relative;
  transition: var(--transition);
  cursor: pointer;

  &.active {
    background: var(--primary);

    .toggle-thumb {
      transform: translateX(22px);
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: var(--transition);
}

.setting-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  padding: 10px 24px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-xs);
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition);
  cursor: pointer;
  width: 100%;

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
