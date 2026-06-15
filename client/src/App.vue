<template>
  <router-view />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { useSettingStore } from '@/stores/setting'
import { useAuthStore } from '@/stores/auth'

const categoryStore = useCategoryStore()
const settingStore = useSettingStore()
const authStore = useAuthStore()

async function loadUserData() {
  if (authStore.isLoggedIn) {
    await Promise.all([
      authStore.fetchProfile(),
      categoryStore.fetchCategories(),
      settingStore.fetchSettings(),
    ])
  }
}

onMounted(() => {
  loadUserData()
})

// 监听登录状态变化
watch(() => authStore.isLoggedIn, (val) => {
  if (val) {
    loadUserData()
  }
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
