<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import apiAdapter from './utils/api.js'
import CommentHandler from './utils/commentHandler.js'

// 导入组件
import {
  MainArea,
  Sidebar,
  CommentSection,
  ModalDialog,
  Footer,
  MusicPlayer
} from './components'

// 响应式数据
const newComment = ref('')
const showBanner = ref(localStorage.getItem('visited') !== 'true')
const showCaptcha = ref(false)
const captchaImage = ref('')
const captchaInput = ref('')
const selectedTieba = ref({})
const tiebaList = ref([])
const comments = ref([])
const isPlaying = ref(false)
const visitCount = ref(0)
const pageViews = ref(0)
const userCount = ref(0)
const clickCount = ref(0)

// 模板引用
const musicPlayerRef = ref(null)
const mainAreaRef = ref(null)

// 监听音乐播放器状态变化
watch(() => musicPlayerRef.value?.isPlaying, (newValue) => {
  if (newValue !== undefined) {
    isPlaying.value = newValue
  }
}, { deep: true })

// 计算属性
const isValidCaptcha = computed(() => {
  return /^\d{6}$/.test(captchaInput.value)
})

// 方法
const loadTiebaList = async () => {
  try {
    const response = await fetch('/data/tieba-list.csv')
    const csvText = await response.text()
    const lines = csvText.split('\n')
    const headers = lines[0].split(',')
    
    tiebaList.value = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',')
      const tieba = {}
      headers.forEach((header, index) => {
        tieba[header.trim()] = values[index] ? values[index].trim() : ''
      })
      tieba.id = parseInt(tieba.id)
      
      if (tieba.name && tieba.name.slice(-1) !== '吧') {
        throw new Error(`贴吧名称 "${tieba.name}" 必须以"吧"结尾`)
      }
      
      return tieba
    })
    
    selectedTieba.value = tiebaList.value[0]
  } catch (error) {
    console.error('加载tieba列表失败:', error)
    throw error
  }
}

const loadComments = async () => {
  try {
    const data = await apiAdapter.getComments()
    comments.value = data.comments
    
    // 调用 MainArea 的 reloadDanmakus 方法重新加载弹幕
    if (mainAreaRef.value) {
      mainAreaRef.value.reloadDanmakus(data.comments)
    }
  } catch (error) {
    console.error('加载评论数据失败:', error)
    comments.value = []
  }
}

const loadStats = async () => {
  try {
    const data = await apiAdapter.getStats()
    userCount.value = data.userCount || 0
    clickCount.value = data.clickCount || 0
    
    if (data.environment) {
      console.log('统计数据环境:', data.environment)
      if (data.visitResult) {
        console.log('访问统计结果:', data.visitResult)
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    userCount.value = 0
    clickCount.value = 0
  }
}

const switchTieba = (tieba) => {
  selectedTieba.value = tieba
}

// 插入单条弹幕的函数
const insertDanmakus = (comment) => {
  if (mainAreaRef.value) {
    mainAreaRef.value.insertDanmakus(comment)
  }
}

const initVisitStats = () => {
  const storedVisitCount = localStorage.getItem('visitCount') || 0
  const storedPageViews = localStorage.getItem('pageViews') || 0
  
  visitCount.value = parseInt(storedVisitCount)
  pageViews.value = parseInt(storedPageViews)
  
  pageViews.value++
  localStorage.setItem('pageViews', pageViews.value)
  
  const lastVisit = localStorage.getItem('lastVisit')
  const today = new Date().toDateString()
  
  if (lastVisit !== today) {
    visitCount.value++
    localStorage.setItem('visitCount', visitCount.value)
    localStorage.setItem('lastVisit', today)
  }
}

const closeBanner = () => {
  showBanner.value = false
  localStorage.setItem('visited', 'true')
}

const submitComment = async () => {
  if (commentHandler.value) {
    await commentHandler.value.submitComment()
  }
}

const refreshCaptcha = async () => {
  if (commentHandler.value) {
    await commentHandler.value.refreshCaptcha()
  }
}

const closeCaptcha = () => {
  if (commentHandler.value) {
    commentHandler.value.closeCaptcha()
  }
}

const validateCaptchaInput = () => {
  if (commentHandler.value) {
    commentHandler.value.validateCaptchaInput()
  }
}

const submitCaptcha = async () => {
  if (commentHandler.value) {
    await commentHandler.value.submitCaptcha()
  }
}

// 实例变量
let commentHandler = ref(null)

// 生命周期
onMounted(async () => {
  // 初始化访问统计
  initVisitStats()
  
  // 页面加载时自动显示弹窗给新用户
  if (localStorage.getItem('visited') !== 'true') {
    setTimeout(() => {
      showBanner.value = true
    }, 1000)
  }
  
  // 同时加载tieba列表、评论数据和统计数据
  await Promise.all([
    loadTiebaList(),
    loadComments(),
    loadStats()
  ])
  
  // 初始化评论处理器
  commentHandler.value = new CommentHandler({
    newComment,
    comments,
    apiAdapter,
    captchaImage,
    captchaInput,
    showCaptcha,
    nextTick,
    insertDanmakus
  })
})
</script>

<template>
  <div id="app">
    <div class="site-title" @click="showBanner = true">原神天堂内鬼吧二周年共创纪念</div>
    <div class="container">
      <!-- 主体区域 -->
      <MainArea 
        :selected-tieba="selectedTieba" 
        :is-playing="isPlaying"
        ref="mainAreaRef"
      />
      
      <!-- 音乐播放器 -->
      <MusicPlayer 
        :selected-tieba="selectedTieba"
        ref="musicPlayerRef"
      />

      <!-- 侧边栏 -->
      <Sidebar 
        :tieba-list="tiebaList" 
        @switch-tieba="switchTieba"
      />

      <!-- 留言区域 -->
      <CommentSection 
        :new-comment="newComment"
        :comments="comments"
        @submit-comment="submitComment"
        @update:new-comment="newComment = $event"
      />
    </div>

    <!-- 网站声明弹窗 -->
    <ModalDialog 
      :visible="showBanner"
      type="info"
      title="网站信息"
      :stats="{ pageViews, userCount }"
      @close="closeBanner"
    />
    
    <!-- 验证码对话框 -->
    <ModalDialog 
      :visible="showCaptcha"
      type="captcha"
      title="验证码验证"
      :captcha-image="captchaImage"
      :captcha-input="captchaInput"
      :is-valid-captcha="isValidCaptcha"
      @close="closeCaptcha"
      @refresh-captcha="refreshCaptcha"
      @submit-captcha="submitCaptcha"
      @validate-captcha-input="validateCaptchaInput"
      @update:captcha-input="captchaInput = $event"
    />
    
    <!-- 底部信息 -->
    <Footer />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: "Microsoft YaHei", sans-serif;
  background-color: #e6f3ff;
  background-image: linear-gradient(135deg, #e6f3ff 0%, #b3d9ff 50%, #80c0ff 100%);
  overflow-x: hidden;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.site-title {
  text-align: center;
  font-size: 2em;
  font-weight: bold;
  color: #1a75ff;
  margin: 20px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 2px 2px 4px rgba(26, 117, 255, 0.2);
}

.site-title:hover {
  color: #4da6ff;
  transform: scale(1.05);
}
</style>
