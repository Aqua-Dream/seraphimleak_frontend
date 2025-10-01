<script setup>
import { ref, computed, onMounted } from 'vue'
import MainArea from './components/MainArea.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import CommentSection from './components/CommentSection.vue'
import ModalDialog from './components/ModalDialog.vue'
import Footer from './components/Footer.vue'
import apiAdapter from './utils/api.js'
import tiebaListData from './data/tieba-list.json'

// 响应式数据
const selectedTieba = ref({
  id: 0,
  name: '加载中...',
  description: '正在加载贴吧信息...',
  avatar: '',
  backgroundImages: [],
  currentBackgroundIndex: 0,
  songs: []
})
const tiebaList = ref([])
const comments = ref([])
const newComment = ref('')
const isPlaying = ref(false)
const userCount = ref(0)
const clickCount = ref(0)
const showBanner = ref(true)

// 加载状态
const isLoading = ref(true)

// 组件引用
const mainAreaRef = ref(null)
const musicPlayerRef = ref(null)
const commentSectionRef = ref(null)

// 加载tieba列表
const loadTiebaList = async () => {
  try {
    for (const tieba of tiebaListData) {
      // 验证贴吧名称格式
      if (tieba.name && tieba.name.slice(-1) !== '吧') {
        throw new Error(`贴吧名称 "${tieba.name}" 必须以"吧"结尾`)
      }
      
      // 为每个歌曲添加cover信息
      if (tieba.songs) {
        for (var song of tieba.songs) {
          if(song.cover == null) {
            song.cover = tieba.avatar
          }
        }
      }
      
      // 为每个贴吧添加当前背景图片索引
      tieba.currentBackgroundIndex = 0
      // 为每个贴吧添加当前背景图片索引（随机）
      // const bgLen = Array.isArray(tieba.backgroundImages) ? tieba.backgroundImages.length : 0
      // tieba.currentBackgroundIndex = bgLen > 0 ? Math.floor(Math.random() * bgLen) : 0
    }
    // 直接使用导入的JSON数据
    tiebaList.value = tiebaListData
    selectedTieba.value = tiebaList.value[0]
  } catch (error) {
    console.error('加载tieba列表失败:', error)
    throw error
  }
}

const loadComments = async () => {
  try {
    const data = await apiAdapter.getAllComments()
    comments.value = (data.comments || []).reverse()
    
    // 随机化弹幕列表：使用Fisher-Yates算法完全打乱comments数组
    let shuffledComments = []
    if (data.comments && data.comments.length > 0) {
      // 创建数组副本以避免修改原数组
      shuffledComments = [...data.comments]
      
      // Fisher-Yates shuffle算法
      for (let i = shuffledComments.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledComments[i], shuffledComments[j]] = [shuffledComments[j], shuffledComments[i]];
      }
    }
    
    // 调用 MainArea 的 reloadDanmakus 方法重新加载弹幕
    if (mainAreaRef.value) {
      mainAreaRef.value.reloadDanmakus(shuffledComments)
    }
  } catch (error) {
    console.error('加载评论数据失败:', error)
    comments.value = []
  }
}

const loadStats = async () => {
  try {
    const data = await apiAdapter.getStats()
    
    // 从后端获取用户数和点击数
    userCount.value = data.userCount || 0
    clickCount.value = data.clickCount || 0
    
    if (data.environment) {
      console.log('统计数据环境:', data.environment)
    }
    
    console.log('从后端获取的统计数据:', { 
      userCount: userCount.value, 
      clickCount: clickCount.value
    })
  } catch (error) {
    console.error('加载统计数据失败:', error)
    userCount.value = 0
    clickCount.value = 0
  }
}

const switchTieba = (tieba) => {
  const bgLen = Array.isArray(tieba.backgroundImages) ? tieba.backgroundImages.length : 0
  const randomBgIndex = bgLen > 0 ? Math.floor(Math.random() * bgLen) : 0
  selectedTieba.value = {
    ...tieba,
    currentBackgroundIndex: randomBgIndex
  }
}

// 插入单条弹幕的函数
const insertDanmakus = (comment) => {
  if (mainAreaRef.value) {
    mainAreaRef.value.insertDanmakus(comment)
  }
}

// 处理新评论的函数
const handleNewComment = (newComment) => {
  // 添加新评论到列表末尾（因为评论是倒序排列的）
  comments.value.push(newComment)
  
  // 触发弹幕插入
  insertDanmakus(newComment)
}

// 处理音乐播放状态变化
const handleMusicStateChange = (playing) => {
  isPlaying.value = playing
}

const closeBanner = () => {
  showBanner.value = false
  musicPlayerRef.value.aplayer.list.switch(0)
  musicPlayerRef.value.aplayer.play()
}



// 生命周期
onMounted(async () => {
  // 完成组件加载
  isLoading.value = false 
  try {
    // 加载所有数据
    await Promise.all([
      loadTiebaList(),
      loadComments(),
      loadStats()
    ])
    
    // 在数据加载完成后，开始预加载背景图片
    apiAdapter.preloadBackgroundImages()
  } catch (error) {
    console.error('页面初始化失败:', error)
  }
})
</script>

<template>
  <div id="app">
    <div class="site-title">
      <img src="../public/assets/backgrounds/banner1.webp" alt="" class="title-image">
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载页面内容...</div>
    </div>

    <div v-else class="container">
      <!-- 主体区域 -->
      <MainArea :selected-tieba="selectedTieba" :is-playing="isPlaying" :tieba-list="tiebaList"
        @switch-tieba="switchTieba" ref="mainAreaRef" />

      <!-- 音乐播放器 -->
      <MusicPlayer :selected-tieba="selectedTieba" ref="musicPlayerRef" @music-state-change="handleMusicStateChange" />

      <!-- 留言区域 -->
      <CommentSection :new-comment="newComment" :comments="comments" :api-adapter="apiAdapter"
        @update:new-comment="newComment = $event" @new-comment="handleNewComment" ref="commentSectionRef" />
    </div>

    <!-- 网站声明弹窗 -->
    <ModalDialog :visible="showBanner" type="info" title="网站信息" :stats="{ clickCount, userCount }"
      @close="closeBanner" />

    <!-- 底部信息 -->
    <Footer />
  </div>
</template>

<style>
#app {
  overflow-x: hidden;
}
body {
  margin: 0;
  font-family: "Microsoft YaHei", sans-serif;
  background: #EEF9FF;
  overflow-x: hidden;
}

.container {
  max-width: 1300px;
  margin: 0 auto;
}

.site-title {
  text-align: center;
  font-size: 2em;
  font-weight: bold;
}
/* 留言标题 */
.message-title {
  margin: 32px 0;
  text-align: center;
}

.message-center {
  font-size: clamp(10px, 3vw, 40px);
  font-weight: bold;
  color: #323334;
  width: 60%;
  display: inline-block;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 星星图片样式 */
.message-title img {
  width: 15%;
  height: auto;
  object-fit: contain;
}
.title-image {
  max-width: 1300px;
  width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
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
@media (max-width: 768px) {
  .message-title {
    padding-bottom: 30px;
  }
}

@media (max-width: 480px) {
  .message-title {
    padding-bottom: 15px;
  }
}
</style>
