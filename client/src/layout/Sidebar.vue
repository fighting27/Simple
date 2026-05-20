<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-dot"></div>
        <span v-show="!isCollapsed" class="logo-text">简易记账</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="(item, index) in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        :style="{ '--index': index }"
      >
        <el-icon class="nav-icon" :size="18">
          <component :is="item.icon" />
        </el-icon>
        <span v-show="!isCollapsed" class="nav-text">{{ item.title }}</span>
        <span v-if="isActive(item.path)" class="nav-active-dot"></span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button class="collapse-btn" @click="toggleCollapse">
        <el-icon :size="16">
          <Fold v-if="!isCollapsed" />
          <Expand v-else />
        </el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isCollapsed = ref(false)

const menuItems = [
  { path: '/', title: '仪表盘', icon: 'Odometer' },
  { path: '/transactions', title: '收支记录', icon: 'List' },
  { path: '/categories', title: '分类管理', icon: 'Grid' },
  { path: '/charts', title: '图表分析', icon: 'TrendCharts' },
  { path: '/data', title: '数据管理', icon: 'FolderOpened' },
  { path: '/settings', title: '设置', icon: 'Setting' },
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style lang="scss" scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: width 0.3s var(--ease-spring);
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  // 毛玻璃效果
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-right: 1px solid var(--border-light);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.1);

  &.collapsed {
    width: 64px;

    .sidebar-header {
      padding: 20px 16px;
    }

    .logo {
      justify-content: center;
    }

    .nav-item {
      padding: 10px 0;
      justify-content: center;
    }

    .nav-icon {
      margin: 0;
    }

    .nav-text {
      display: none;
    }

    .nav-active-dot {
      display: none;
    }

    .sidebar-footer {
      justify-content: center;
    }
  }
}

.sidebar-header {
  padding: 24px 20px;
  transition: padding 0.3s var(--ease-spring);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.85); }
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  letter-spacing: -0.04em;
}

.sidebar-nav {
  flex: 1;
  padding: 4px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
  text-decoration: none;
  position: relative;
  letter-spacing: -0.01em;

  &:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
    transform: translateX(2px);
  }

  &.active {
    color: var(--primary-dark);
    background: var(--primary-muted);
    font-weight: 600;

    .nav-icon {
      color: var(--primary);
    }
  }
}

.nav-icon {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.nav-active-dot {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--primary);
  animation: pulse-dot 2s ease-in-out infinite;
}

.sidebar-footer {
  padding: 12px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-light);
}

.collapse-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  background: transparent;
  transition: var(--transition);
  cursor: pointer;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-secondary);
  }

  &:active {
    transform: scale(0.92);
  }
}
</style>
