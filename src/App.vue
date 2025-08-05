<script setup>
import { ref, computed, onMounted } from 'vue'
import MainArea from './components/MainArea.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import Sidebar from './components/Sidebar.vue'
import CommentSection from './components/CommentSection.vue'
import ModalDialog from './components/ModalDialog.vue'
import Footer from './components/Footer.vue'
import apiAdapter from './utils/api.js'

// 响应式数据
const selectedTieba = ref({
  name: '加载中...',
  description: '正在加载贴吧信息...',
  avatar: '',
  backgroundImage: ''
})
const tiebaList = ref([])
const comments = ref([])
const newComment = ref('')
const isPlaying = ref(false)
const userCount = ref(0)
const clickCount = ref(0)
const pageViews = ref(0)
const visitCount = ref(0)
const showBanner = ref(false)

// 加载状态
const isLoading = ref(true)

// 组件引用
const mainAreaRef = ref(null)
const musicPlayerRef = ref(null)
const commentSectionRef = ref(null)

// 加载tieba列表
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
    const data = await apiAdapter.getAllComments()
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

// 处理新评论的函数
const handleNewComment = (newComment) => {
  // 添加新评论到列表开头
  comments.value = [newComment, ...comments.value]
  
  // 触发弹幕插入
  insertDanmakus(newComment)
}

// 处理音乐播放状态变化
const handleMusicStateChange = (playing) => {
  isPlaying.value = playing
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
  
  // 先设置加载完成，让组件渲染
  isLoading.value = false
  
  try {
    // 然后加载数据
    await Promise.all([
      loadTiebaList(),
      loadComments(),
      loadStats()
    ])
  } catch (error) {
    console.error('页面初始化失败:', error)
  }
})
</script>

<template>
  <div id="app">
    <div class="site-title" @click="showBanner = true">原神天堂内鬼吧二周年共创纪念</div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载页面内容...</div>
    </div>
    
    <div v-else class="container">
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
        @music-state-change="handleMusicStateChange"
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
        :api-adapter="apiAdapter"
        @update:new-comment="newComment = $event"
        @new-comment="handleNewComment"
        ref="commentSectionRef"
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

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1a75ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  font-size: 18px;
  color: #666;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
