<template>
  <div class="login-page">
    <!-- 3D 粒子波浪背景 -->
    <canvas ref="waveCanvasRef" class="wave-canvas"></canvas>

    <!-- 动态背景 -->
    <div class="bg-layer">
      <div class="mesh-gradient"></div>
      <div class="mesh-gradient mesh-gradient--2"></div>
      <div class="mesh-gradient mesh-gradient--3"></div>
      <div class="grain-overlay"></div>
    </div>

    <!-- 主内容 -->
    <div class="login-container">
      <!-- 左侧品牌区 -->
      <div class="brand-side">
        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-mark">
              <img src="/favicon1.png" alt="logo" width="32" height="32" />
            </div>
            <span class="logo-name">简易记账</span>
          </div>

          <h1 class="brand-headline">
            智能管理<br/>
            <span class="headline-accent">每一笔收支</span>
          </h1>

          <p class="brand-desc">
            简洁优雅的个人财务管理工具，AI 驱动的消费洞察，让记账变得轻松高效。
          </p>

          <div class="brand-features">
            <div class="feature-item" v-for="(feat, i) in features" :key="i"
                 :style="{ '--delay': i * 0.1 + 's' }">
              <div class="feature-icon">
                <svg v-if="feat.icon === 'chart'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
                </svg>
                <svg v-else-if="feat.icon === 'ai'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z"/><path d="M16 11h2a4 4 0 0 1 4 4v1a8 8 0 0 1-16 0v-1a4 4 0 0 1 4-4h2"/><circle cx="12" cy="17" r="1"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <span>{{ feat.text }}</span>
            </div>
          </div>
        </div>

        <div class="brand-footer">
          <span class="footer-text">Powered by AI</span>
          <span class="footer-dot"></span>
          <span class="footer-text">v2.0</span>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="form-side">
        <div class="glow-border-wrapper">
        <div class="form-card">
          <!-- 移动端 Logo -->
          <div class="mobile-logo">
            <div class="logo-mark">
              <img src="/favicon1.png" alt="logo" width="28" height="28" />
            </div>
            <span class="logo-name">简易记账</span>
          </div>

          <div class="form-header">
            <h2>{{ isLogin ? '欢迎回来' : '创建账号' }}</h2>
            <p>{{ isLogin ? '登录以继续管理您的财务' : '注册开始记录您的收支' }}</p>
          </div>

          <!-- Tab 切换 -->
          <div class="tabs">
            <button
              class="tab"
              :class="{ active: isLogin }"
              @click="isLogin = true; errorMsg = ''"
            >
              登录
            </button>
            <button
              class="tab"
              :class="{ active: !isLogin }"
              @click="isLogin = false; errorMsg = ''"
            >
              注册
            </button>
          </div>

          <!-- 错误提示 -->
          <Transition name="shake">
            <div v-if="errorMsg" class="error-msg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>{{ errorMsg }}</span>
            </div>
          </Transition>

          <!-- 登录表单 -->
          <Transition name="slide-fade" mode="out-in">
            <form v-if="isLogin" key="login" @submit.prevent="handleLogin" class="form">
              <div class="form-item" style="--index: 0">
                <label>用户名</label>
                <div class="input-wrapper">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    v-model="loginForm.username"
                    type="text"
                    placeholder="请输入用户名"
                    autocomplete="username"
                  />
                </div>
              </div>
              <div class="form-item" style="--index: 1">
                <label>密码</label>
                <div class="input-wrapper">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    v-model="loginForm.password"
                    type="password"
                    placeholder="请输入密码"
                    autocomplete="current-password"
                  />
                </div>
              </div>
              <button type="submit" class="submit-btn" :disabled="loading" style="--index: 2">
                <span v-if="loading" class="btn-loader"></span>
                <span v-else>登录</span>
              </button>
            </form>

            <!-- 注册表单 -->
            <form v-else key="register" @submit.prevent="handleRegister" class="form">
              <div class="form-item" style="--index: 0">
                <label>用户名</label>
                <div class="input-wrapper">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    v-model="registerForm.username"
                    type="text"
                    placeholder="3-20个字符"
                    autocomplete="username"
                  />
                </div>
              </div>
              <div class="form-item" style="--index: 1">
                <label>昵称</label>
                <div class="input-wrapper">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  <input
                    v-model="registerForm.nickname"
                    type="text"
                    placeholder="可选，不填默认为用户名"
                    autocomplete="nickname"
                  />
                </div>
              </div>
              <div class="form-item" style="--index: 2">
                <label>密码</label>
                <div class="input-wrapper">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    v-model="registerForm.password"
                    type="password"
                    placeholder="至少6个字符"
                    autocomplete="new-password"
                  />
                </div>
              </div>
              <div class="form-item" style="--index: 3">
                <label>确认密码</label>
                <div class="input-wrapper">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <input
                    v-model="registerForm.confirmPassword"
                    type="password"
                    placeholder="再次输入密码"
                    autocomplete="new-password"
                  />
                </div>
              </div>
              <button type="submit" class="submit-btn" :disabled="loading" style="--index: 4">
                <span v-if="loading" class="btn-loader"></span>
                <span v-else>注册</span>
              </button>
            </form>
          </Transition>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const loading = ref(false)
const errorMsg = ref('')

// 3D 粒子波浪
const waveCanvasRef = ref(null)
let animationId = null
let handleMouseMoveRef = null
let handleResizeRef = null

onMounted(() => {
  const canvas = waveCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()

  // 鼠标位置（归一化到 -1 ~ 1）
  const mouse = { x: 0, y: 0 }
  const handleMouseMove = (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  handleMouseMoveRef = handleMouseMove
  handleResizeRef = resize
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('resize', resize)

  const config = {
    cols: 80,
    rows: 60,
    spacing: 18,
    baseRadius: 1.8,
    waveSpeed: 0.01,
    waveAmplitude: 80,
    waveFrequency: 0.025,
    perspective: 800,
    mouseInfluence: 0.15,
  }

  let time = 0

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // 鼠标驱动的视角偏移
    const cameraOffsetX = mouse.x * 50 * config.mouseInfluence
    const cameraOffsetY = mouse.y * 30 * config.mouseInfluence

    const particles = []

    // 生成所有粒子并计算 3D 坐标
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        // 网格坐标（中心对齐）
        const gridX = (col - config.cols / 2) * config.spacing
        const gridZ = (row - config.rows / 2) * config.spacing

        // 多层波浪叠加
        const wave1 = Math.sin(gridX * config.waveFrequency + time) * config.waveAmplitude
        const wave2 = Math.cos(gridZ * config.waveFrequency * 0.7 + time * 1.3) * config.waveAmplitude * 0.6
        const wave3 = Math.sin((gridX + gridZ) * config.waveFrequency * 0.4 + time * 0.7) * config.waveAmplitude * 0.3
        const wave4 = Math.sin(Math.sqrt(gridX * gridX + gridZ * gridZ) * config.waveFrequency * 0.6 - time * 1.5) * config.waveAmplitude * 0.2

        const y = wave1 + wave2 + wave3 + wave4

        // 3D 透视投影
        const depth = gridZ + config.perspective
        const scale = config.perspective / depth
        const projX = centerX + (gridX + cameraOffsetX) * scale
        const projY = centerY + (y + cameraOffsetY) * scale

        // 根据深度计算大小和透明度
        const normalizedDepth = (gridZ + config.rows * config.spacing / 2) / (config.rows * config.spacing)
        const depthAlpha = 0.2 + (1 - normalizedDepth) * 0.6
        const depthRadius = config.baseRadius * scale * 0.8

        // 波浪高度影响亮度
        const heightNorm = y / config.waveAmplitude
        const heightAlpha = 0.5 + heightNorm * 0.5

        const alpha = Math.min(1, depthAlpha * heightAlpha)
        const radius = Math.max(0.5, depthRadius)

        particles.push({ x: projX, y: projY, r: radius, alpha, depth: gridZ })
      }
    }

    // 按深度排序（远的先画）
    particles.sort((a, b) => a.depth - b.depth)

    // 绘制粒子
    for (const p of particles) {
      if (p.x < -10 || p.x > canvas.width + 10 || p.y < -10 || p.y > canvas.height + 10) continue

      ctx.beginPath()
      ctx.fillStyle = `rgba(120, 200, 180, ${p.alpha})`
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()

      // 发光效果（大粒子）
      if (p.r > 2) {
        ctx.beginPath()
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
        gradient.addColorStop(0, `rgba(120, 200, 180, ${p.alpha * 0.3})`)
        gradient.addColorStop(1, 'rgba(120, 200, 180, 0)')
        ctx.fillStyle = gradient
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    time += config.waveSpeed
    animationId = requestAnimationFrame(animate)
  }

  animate()
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (handleMouseMoveRef) window.removeEventListener('mousemove', handleMouseMoveRef)
  if (handleResizeRef) window.removeEventListener('resize', handleResizeRef)
})

const features = [
  { icon: 'chart', text: '可视化图表分析' },
  { icon: 'ai', text: 'AI 智能消费洞察' },
  { icon: 'lock', text: '数据安全隔离' },
]

const loginForm = ref({
  username: '',
  password: '',
})

const registerForm = ref({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
})

async function handleLogin() {
  errorMsg.value = ''

  if (!loginForm.value.username || !loginForm.value.password) {
    errorMsg.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  try {
    await authStore.login(loginForm.value)
    router.push('/')
  } catch (e) {
    if (!e._handled) errorMsg.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  errorMsg.value = ''

  if (!registerForm.value.username || !registerForm.value.password) {
    errorMsg.value = '请输入用户名和密码'
    return
  }

  if (registerForm.value.password.length < 6) {
    errorMsg.value = '密码至少6个字符'
    return
  }

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  try {
    await authStore.register({
      username: registerForm.value.username,
      password: registerForm.value.password,
      nickname: registerForm.value.nickname,
    })
    router.push('/')
  } catch (e) {
    if (!e._handled) errorMsg.value = e.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  overflow: hidden;
}

// ========== 3D 粒子波浪 ==========
.wave-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

// ========== 动态背景 ==========
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: #f0f4f8;
}

.mesh-gradient {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.5;
  animation: float-1 20s ease-in-out infinite;

  background: radial-gradient(circle, rgba(96, 165, 250, 0.3), rgba(59, 130, 246, 0.15), transparent 70%);
  top: -10%;
  left: -5%;

  &--2 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(147, 197, 253, 0.35), rgba(96, 165, 250, 0.1), transparent 70%);
    top: 40%;
    right: -10%;
    animation: float-2 25s ease-in-out infinite;
  }

  &--3 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.08), transparent 70%);
    bottom: -10%;
    left: 30%;
    animation: float-3 22s ease-in-out infinite;
  }
}

@keyframes float-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, 30px) scale(1.05); }
  66% { transform: translate(-20px, -15px) scale(0.95); }
}

@keyframes float-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-35px, 25px) scale(1.08); }
  66% { transform: translate(25px, -20px) scale(0.92); }
}

@keyframes float-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -35px) scale(1.06); }
  66% { transform: translate(-25px, 20px) scale(0.94); }
}

.grain-overlay {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
}

// ========== 主容器 ==========
.login-container {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;

  @media (max-width: 900px) {
    flex-direction: column;
  }
}

// ========== 左侧品牌区 ==========
.brand-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px 56px;
  position: relative;
  overflow: hidden;

  @media (max-width: 900px) {
    display: none;
  }
}

.brand-content {
  max-width: 440px;
  animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
}

.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 8px rgba(16, 185, 129, 0.3));
}

.logo-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.04em;
}

.brand-headline {
  font-size: 42px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.15;
  letter-spacing: -0.04em;
  margin-bottom: 20px;
}

.headline-accent {
  background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-desc {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 40px;
  max-width: 380px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--delay);
}

.feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10B981;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  flex-shrink: 0;
}

.brand-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.4s;
}

.footer-text {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.footer-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--text-muted);
}

// ========== 右侧表单区 ==========
.form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  width: 440px;
  flex-shrink: 0;

  @media (max-width: 900px) {
    width: 100%;
    padding: 24px 20px;
    flex: 1;
  }
}

// ========== 渐变光晕边框 ==========
.glow-border-wrapper {
  position: relative;
  width: 380px;
  max-width: 100%;
  border-radius: 22px;
  padding: 2px;
  background: conic-gradient(
    from var(--glow-angle, 0deg),
    #6EE7B7,
    #93C5FD,
    #C4B5FD,
    #F9A8D4,
    #6EE7B7
  );
  animation: glow-rotate 4s linear infinite;

  @media (max-width: 480px) {
    width: 100%;
    border-radius: 20px;
  }
}

@property --glow-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes glow-rotate {
  to { --glow-angle: 360deg; }
}

.form-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: none;
  border-radius: 20px;
  padding: 36px 32px 44px;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.07), 0 4px 10px -4px rgba(15, 23, 42, 0.04);
  animation: fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.15s;
  position: relative;
  z-index: 1;

  @media (max-width: 480px) {
    width: 100%;
    padding: 28px 24px 36px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.95);
  }
}

// 移动端 Logo
.mobile-logo {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;

  @media (max-width: 900px) {
    display: flex;
  }
}

.form-header {
  margin-bottom: 36px;

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.03em;
    margin-bottom: 6px;
  }

  p {
    font-size: 14px;
    color: var(--text-muted);
  }
}

// ========== Tab 切换 ==========
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  margin-bottom: 24px;
}

.tab {
  flex: 1;
  padding: 10px 16px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  transition: color 0.25s ease;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    background: transparent;
    border-radius: 2px;
    transition: background 0.25s ease;
  }

  &.active {
    color: #10B981;

    &::after {
      background: #10B981;
    }
  }
}

// ========== 错误提示 ==========
.error-msg {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #FEF2F2;
  border: 1px solid rgba(254, 202, 202, 0.6);
  border-radius: 12px;
  color: #DC2626;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 20px;

  svg {
    flex-shrink: 0;
  }
}

// ========== 表单 ==========
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 7px;
  animation: fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(0.2s + var(--index, 0) * 0.06s);

  label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: -0.01em;
  }
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
  transition: color 0.2s ease;
}

input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.6);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  font-family: var(--font-sans);

  &:hover {
    border-color: rgba(148, 163, 184, 0.7);
    background: rgba(255, 255, 255, 0.8);
  }

  &:focus {
    border-color: #10B981;
    background: white;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
  }

  &::placeholder {
    color: #94A3B8;
  }
}

// 让 focus 时 icon 变色生效
.input-wrapper:focus-within .input-icon {
  color: #10B981;
}

// ========== 提交按钮 ==========
.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  animation: fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(0.3s + var(--index, 0) * 0.06s);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -4px rgba(16, 185, 129, 0.35);

    &::before {
      opacity: 1;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.btn-loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ========== 过渡动画 ==========
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.shake-enter-active {
  animation: shake-in 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.shake-leave-active {
  transition: all 0.2s ease-out;
}

.shake-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes shake-in {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}
</style>
