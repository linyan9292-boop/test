import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHashHistory } from 'vue-router' // 导入路由相关功能

// 路由组件
import WelcomePage from './views/home/WelcomePage.vue'

// 定义路由
const routes = [
  {
    path: '/',
    name: '欢迎',
    component: WelcomePage,
    meta: {
      title: '欢迎 - 盲盒派对',
    },
  },
  {
    path: '/recharge',
    name: '充值钻石',
    component: () => import('./views/commerce/RechargePage.vue'),
    meta: { title: '充值钻石 - 盲盒派对' },
  },
  {
    path: '/voucher',
    name: '获取代金券',
    component: () => import('./views/commerce/VoucherPage.vue'),
    meta: { title: '获取代金券 - 盲盒派对' },
  },

  {
    path: '/chouka',
    name: '抽卡模拟器主页',
    component: () => import('./views/gacha/GachaHomePage.vue'), // 抽卡模拟器主页组件
    meta: {
      title: '抽卡模拟器主页 - 盲盒派对',
    },
  },
  {
    path: '/chouka/:poolId', // 动态路由参数:poolId 用于区分不同的卡池
    name: '抽卡模拟器',
    component: () => import('./views/gacha/GachaPage.vue'), // 抽卡页面组件
    props: true, // 将路由参数作为props传递给组件
    meta: {
      title: '抽卡模拟器 - 盲盒派对',
    },
  },
  {
    path: '/choukatiaozhansai/:poolId', // 动态路由参数:poolId 用于区分不同的卡池
    name: '抽卡挑战赛',
    component: () => import('./views/gacha/GachaChallangePage.vue'), // 抽卡挑战赛页面组件
    props: true, // 将路由参数作为props传递给组件
    meta: {
      title: '抽卡挑战赛 - 盲盒派对',
    },
  },
  {
    path: '/game/:poolId',
    name: '抽卡肉鸽闯关',
    component: () => import('./views/game/RoguelikeGamePage.vue'),
    props: true,
    meta: { title: '抽卡闯关 - 盲盒派对' },
  },
  {
    path: '/zidingyichouka',
    name: '自定义卡池',
    component: () => import('./views/gacha/CustomGachaPage.vue'), // 自定义卡池页面组件
    meta: {
      title: '自定义卡池 - 盲盒派对',
    },
  },
  {
    path: '/team',
    name: '队伍配置',
    component: () => import('./views/game/TeamConfigPage.vue'),
    meta: { title: '队伍配置 - 盲盒派对' },
  },
  {
    path: '/dungeon',
    name: '装备副本',
    component: () => import('./views/game/EquipDungeonPage.vue'),
    meta: { title: '装备副本 - 盲盒派对' },
  },
  {
    path: '/inventory',
    name: '背包',
    component: () => import('./views/inventory/InventoryPage.vue'),
    meta: { title: '背包 - 盲盒派对' },
  },
  {
    path: '/character/:id',
    name: '角色详情',
    component: () => import('./views/inventory/CharacterDetailPage.vue'),
    meta: { title: '角色详情 - 盲盒派对' },
  },
  {
    path: '/test-gacha',
    name: '测试抽卡',
    component: () => import('./views/gacha/TestGacha.vue'), // 测试抽卡页面组件
    meta: {
      title: '测试抽卡页面',
    },
  },
  {
    path: '/zako',
    name: 'Zako',
    component: () => import('./views/misc/ZakoPage.vue'),
    meta: {
      title: 'Zako - 织夜工具箱',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('./views/misc/NotFound.vue'),
  }, // 404 页面处理
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const defaultTitle = '盲盒派对'
router.afterEach((to) => {
  // 如果路由有 meta.title，则使用它，否则使用默认标题
  document.title = to.meta.title || defaultTitle
})

// 创建Vue应用
const app = createApp(App)
app.use(router)
app.mount('#app')
