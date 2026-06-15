import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, getProfile } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(data) {
    const res = await loginApi(data)
    const result = res.data
    token.value = result.token
    user.value = result.user
    localStorage.setItem('token', result.token)
    return result
  }

  async function register(data) {
    const res = await registerApi(data)
    const result = res.data
    token.value = result.token
    user.value = result.user
    localStorage.setItem('token', result.token)
    return result
  }

  async function fetchProfile() {
    try {
      const res = await getProfile()
      user.value = res.data
    } catch (e) {
      // token 无效，清除
      logout()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    fetchProfile,
    logout,
  }
})
