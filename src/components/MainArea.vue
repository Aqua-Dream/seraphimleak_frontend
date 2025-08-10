<template>
  <div class="main-area">
    <!-- 内容区域 - 包含头像和弹幕 -->
    <div class="content-area" :style="contentAreaStyle">
      <div class="main-title" @click="goToTieba" v-if="showAvatar">
        <div class="text-content">
          <h1>{{ selectedTieba?.name || '加载中...' }}</h1>
          <p>{{ selectedTieba?.description || '正在加载贴吧信息...' }}</p>
        </div>
        <img v-if="selectedTieba?.avatar" :src="selectedTieba.avatar" :alt="selectedTieba.name" class="avatar-large">
        <div v-else class="avatar-placeholder">📷</div>
      </div>

      <!-- 弹幕区域 -->
      <div class="danmaku-container">
        <VueDanmaku ref="danmakuRef" :danmus="[]" loop random-channel :debounce="debounce" :isSuspend="true">
          <template #danmu="{ danmu }"> {{ danmu.content }} </template>
        </VueDanmaku>
      </div>

      <!-- 背景图片轮播 -->
      <div class="background-carousel" v-if="selectedTieba?.backgroundImages && selectedTieba.backgroundImages.length > 1">
        <el-carousel 
          :height="'60px'"
          :interval="0"
          :arrow="'hover'"
          indicator-position="none"
          @change="handleCarouselChange"
          ref="carouselRef"
        >
          <el-carousel-item 
            v-for="(image, index) in selectedTieba.backgroundImages" 
            :key="index"
            class="carousel-item"
          >
            <div class="carousel-image-preview" :style="{ backgroundImage: `url('${image}')` }">
              <span class="image-index">{{ index + 1 }}/{{ selectedTieba.backgroundImages.length }}</span>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="bottom-controls">
      <!-- 贴吧选择器 -->
      <div class="tieba-selector">
        <el-select 
          v-model="selectedTiebaId"
          @change="handleTiebaChange"
          placeholder="选择贴吧"
          class="tieba-select"
          size="default"
        >
          <el-option 
            v-for="item in tiebaList" 
            :key="item.id" 
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </div>

      <!-- 显示控制 -->
      <div class="display-controls">
        <div class="switch-item">
          <el-switch v-model="showAvatar" />
          <span class="switch-label">邮戳</span>
        </div>
        <div class="switch-item">
          <el-switch v-model="showDanmaku" @change="handleDanmakuVisibilityChange" />
          <span class="switch-label">弹幕</span>
        </div>
      </div>

      <!-- 下载控制 -->
      <div class="download-controls" v-if="(selectedTieba?.backgroundImages && selectedTieba.backgroundImages.length > 0) || selectedTieba?.avatar">
        <el-dropdown @command="handleDownloadCommand">
          <el-button type="primary" :icon="Download">
            下载
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="background-only">
                <el-icon><Download /></el-icon>
                纯背景图
              </el-dropdown-item>
              <el-dropdown-item command="with-danmaku">
                <el-icon><Download /></el-icon>
                包含弹幕和标题
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import VueDanmaku from 'vue-danmaku'
import { Download, ArrowDown } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  selectedTieba: {
    type: Object,
    required: true
  },
  isPlaying: {
    type: Boolean,
    default: false
  },
  tiebaList: {
    type: Array,
    required: true
  }
})

// Emits
const emit = defineEmits(['switchTieba'])

const danmakuRef = ref(null)
const debounce = ref(200)
const carouselRef = ref(null)
const showAvatar = ref(true)
const showDanmaku = ref(true)

// 计算当前选中的贴吧ID
const selectedTiebaId = computed({
  get: () => props.selectedTieba?.id || 0,
  set: (value) => {
    const selectedTieba = props.tiebaList.find(tieba => tieba.id === value)
    if (selectedTieba) {
      emit('switchTieba', selectedTieba)
    }
  }
})

// 处理贴吧切换
const handleTiebaChange = (value) => {
  const selectedTieba = props.tiebaList.find(tieba => tieba.id === value)
  if (selectedTieba) {
    emit('switchTieba', selectedTieba)
  }
}

// 处理轮播图切换
const handleCarouselChange = (index) => {
  // 直接修改当前贴吧的背景索引
  if (props.selectedTieba) {
    props.selectedTieba.currentBackgroundIndex = index
  }
}

// 监听背景图片索引变化，同步轮播图位置
watch(() => props.selectedTieba?.currentBackgroundIndex, (newIndex) => {
  if (carouselRef.value && typeof newIndex === 'number') {
    // 使用nextTick确保DOM更新后再设置轮播图位置
    nextTick(() => {
      if (carouselRef.value && carouselRef.value.setActiveItem) {
        carouselRef.value.setActiveItem(newIndex)
      }
    })
  } 
}, { immediate: true })

// 处理弹幕显示/隐藏
const handleDanmakuVisibilityChange = (value) => {
  if (!danmakuRef.value) return
  
  if (value) {
    danmakuRef.value.show()
  } else {
    danmakuRef.value.hide()
  }
}

// 处理下载命令
const handleDownloadCommand = (command) => {
  const includeDanmaku = command === 'with-danmaku'
  downloadBackground(includeDanmaku)
}

// 下载背景图功能
const downloadBackground = (includeDanmaku) => {
  const backgroundImages = props.selectedTieba?.backgroundImages
  const currentIndex = props.selectedTieba?.currentBackgroundIndex || 0
  
  if (!backgroundImages && !props.selectedTieba?.avatar) {
    return
  }
  
  const imageUrl = (backgroundImages && backgroundImages.length > 0) 
    ? (backgroundImages[currentIndex] || backgroundImages[0]) 
    : props.selectedTieba.avatar
  const fileName = props.selectedTieba.name + (includeDanmaku ? '_含弹幕' : '_纯背景') + '.jpg'
  
  // 目前功能一致，后续可以扩展
  const link = document.createElement('a')
  link.href = imageUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 重新加载所有弹幕的函数
const reloadDanmakus = (comments) => {
  if (!danmakuRef.value) return

  // 停止并清空现有弹幕
  danmakuRef.value.stop()

  // 设置debounce值
  var danmakuNum = comments.length
  if(danmakuNum < 30)
    danmakuNum = 30;
  if (danmakuNum > 300)
    danmakuNum = 300;
  debounce.value = 60000 / danmakuNum;

  // 将所有评论添加到弹幕中
  danmakuRef.value.danmuList = comments
}

// 插入单条弹幕的函数
const insertDanmakus = (comment) => {
  if (!danmakuRef.value) return

  // 添加单条弹幕
  danmakuRef.value.addDanmu({
    content: comment.content
  }, 'current')
  if (!props.isPlaying) {
    danmakuRef.value.pause()
  }
}

watch(() => props.isPlaying, (newIsPlaying, _) => {
  if (newIsPlaying) {
    danmakuRef.value.play()
  } else {
    danmakuRef.value.pause()
  }
}, { deep: true })

// 暴露函数给父组件
defineExpose({
  reloadDanmakus,
  insertDanmakus
})

// 生命周期钩子
onMounted(() => {
  // 移除原有的点击外部关闭逻辑，Element Plus的dropdown会自动处理
  
  // 初始化弹幕显示状态
  nextTick(() => {
    if (danmakuRef.value) {
      if (showDanmaku.value) {
        danmakuRef.value.show()
      } else {
        danmakuRef.value.hide()
      }
    }
  })
})

onUnmounted(() => {
  // 移除原有的点击外部关闭逻辑
})

// 计算属性
const contentAreaStyle = computed(() => {
  const backgroundImages = props.selectedTieba?.backgroundImages
  const currentIndex = props.selectedTieba?.currentBackgroundIndex || 0
  
  if (backgroundImages && backgroundImages.length > 0) {
    const currentBackground = backgroundImages[currentIndex] || backgroundImages[0]
    return { background: `url('${currentBackground}') center/cover` }
  } else {
    return { background: 'linear-gradient(45deg, #1a75ff, #4da6ff)' }
  }
})

function goToTieba() {
  if (!props.selectedTieba?.name) {
    return
  }
  const tiebaName = encodeURIComponent(props.selectedTieba.name.slice(0, -1))
  const url = `https://tieba.baidu.com/f?kw=${tiebaName}`
  window.open(url, '_blank')
}

</script>

<style scoped>
/* 主体区域 */
.main-area {
  position: relative;
  width: 100%;
  overflow: hidden;
  transition: transform 0.2s ease;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
}

.content-area {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 15px;
  overflow: hidden;
  padding-bottom: 56.25%;
}

.main-title {
  position: absolute;
  top: 30px;
  right: 30px;
  text-align: right;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  z-index: 10;
}



.text-content {
  text-align: right;
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.3s ease;
}

.main-title:hover .text-content {
  opacity: 1;
  transform: translateX(0);
}

.text-content h1 {
  margin: 0 0 10px 0;
  font-size: 2.5em;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.text-content p {
  margin: 0;
  font-size: 1.2em;
  opacity: 0.9;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(26, 117, 255, 0.3);
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5em;
  color: white;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(26, 117, 255, 0.3);
  flex-shrink: 0;
}

/* 弹幕容器 - 全屏显示 */
.danmaku-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 弹幕文字样式 - 白色字体，黑色边框提高可读性 */


/* 确保弹幕容器内的所有文字都有白色字体和黑色边框 */
:deep(.danmaku-container *) {
  color: white !important;
  text-shadow: 
    -1px -1px 1px #000,
    1px -1px 1px #000,
    -1px 1px 1px #000,
    1px 1px 1px #000;
  background: none !important;
  border: none !important;
}

/* 底部控制栏 */
.bottom-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-radius: 10px;
  overflow: visible;
}

/* 贴吧选择器样式 */
.tieba-selector {
  display: flex;
  align-items: center;
  gap: 15px;
}

.tieba-select {
  min-width: 150px;
}

/* 背景图片轮播样式 */
.background-carousel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 120px; /* 固定宽度 */
  z-index: 10;
}

.carousel-item {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.3);
}

.carousel-item:hover {
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.05);
  background: rgba(0, 0, 0, 0.5);
}

.carousel-image-preview {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2em;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.carousel-image-preview .image-index {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: normal;
}

/* Element Plus Carousel 样式覆盖 */
:deep(.el-carousel__container) {
  height: 60px !important;
}

:deep(.el-carousel__item) {
  width: 60px !important;
  height: 60px !important;
}

:deep(.el-carousel__arrow) {
  background-color: rgba(26, 117, 255, 0.8);
  border: none;
  width: 20px;
  height: 20px;
  font-size: 12px;
}

:deep(.el-carousel__arrow:hover) {
  background-color: rgba(26, 117, 255, 1);
}

/* 显示控制样式 */
.display-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-right: 20px;
}

.switch-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-label {
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

/* Switch 开关样式自定义 */
:deep(.el-switch) {
  --el-switch-on-color: #409eff;
  --el-switch-off-color: rgba(255, 255, 255, 0.3);
}

:deep(.el-switch__core) {
  border-color: rgba(255, 255, 255, 0.3);
}

/* 下载控制样式 */
.download-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  overflow: visible;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-area {
    height: 400px;
  }

  .text-content h1 {
    font-size: 1.8em;
  }

  .content-area {
    height: 100%;
  }
}

</style>