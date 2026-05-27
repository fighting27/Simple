import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'DataBoard' },
      },
      {
        path: '/transactions',
        name: 'Transactions',
        component: () => import('@/views/Transaction.vue'),
        meta: { title: '收支记录', icon: 'List' },
      },
      {
        path: '/categories',
        name: 'Categories',
        component: () => import('@/views/Category.vue'),
        meta: { title: '分类管理', icon: 'Folder' },
      },
      {
        path: '/charts',
        name: 'Charts',
        component: () => import('@/views/Charts.vue'),
        meta: { title: '图表分析', icon: 'PieChart' },
      },
      {
        path: '/ai',
        name: 'AIAnalysis',
        component: () => import('@/views/AIAnalysis.vue'),
        meta: { title: 'AI 分析', icon: 'Cpu' },
      },
      {
        path: '/data',
        name: 'DataManage',
        component: () => import('@/views/DataManage.vue'),
        meta: { title: '数据管理', icon: 'Download' },
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置', icon: 'Setting' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '简易记账本'} - 简易记账本`
  next()
})

export default router
