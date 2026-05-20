<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { useSettingStore } from '@/stores/setting'

const categoryStore = useCategoryStore()
const settingStore = useSettingStore()

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    settingStore.fetchSettings(),
  ])
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
