<template>
  <div class="main-area">
    <!-- 底部控制栏 -->
    <div class="bottom-controls">
      <!-- 贴吧选择器 -->
      <div class="tieba-selector">
        <el-select v-model="selectedTiebaId" @change="handleTiebaChange" placeholder="选择贴吧" class="tieba-select"
          :size="componentSize">
          <el-option v-for="item in tiebaList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </div>

      <el-button-group>
        <el-button type="primary" :icon="CaretLeft" class="icon-large" plain @click="prevCarousel"
          :disabled="!canSwitchCarousel" :size="componentSize"></el-button>
        <el-button type="primary" :icon="CaretRight" class="icon-large" plain @click="nextCarousel"
          :disabled="!canSwitchCarousel" :size="componentSize"></el-button>
      </el-button-group>

      <el-button-group>
        <!-- 设置按钮 -->
        <el-popover v-model:visible="settingsDialogVisible" placement="top-end" trigger="click" style="min-width: 100px"
          width="120px">
          <div class="switch-item">
            <span class="switch-label">弹幕</span>
            <el-switch v-model="showDanmaku" @change="handleDanmakuVisibilityChange" />
          </div>
          <div class="switch-item">
            <span class="switch-label">邮戳</span>
            <el-switch v-model="showAvatar" @change="handleAvatarChange" />
          </div>
          <div class="switch-item">
            <span class="switch-label">标题</span>
            <el-switch v-model="showTiebaName" :disabled="!showAvatar" />
          </div>
            <template #reference>
              <el-button :icon="Setting" plain type="primary" :size="componentSize" :style="{ fontSize: windowWidth <= 480 ? '20px' : '' }">
                <span v-if="windowWidth > 480" class="button-text">设置</span>
              </el-button>
            </template>
          </el-popover>
          <!-- 下载控制 -->
          <el-button :icon="Download" type="primary" @click="handleDownload" plain :size="componentSize" :style="{ fontSize: windowWidth <= 480 ? '20px' : '' }">
            <span v-if="windowWidth > 480" class="button-text">下载</span>
          </el-button>
      </el-button-group>
    </div>
    <!-- 内容区域 - 包含头像和弹幕 -->
    <div class="content-area" id="content">
      <!-- 背景图片 - 覆盖整个content-area -->
      <div class="background-container">
        <img 
          v-for="(image, index) in selectedTieba.backgroundImages" 
          :key="index"
          :src="image" 
          alt="" 
          class="background-image"
          :class="{ 'active': index === currentBackgroundIndex }"
        />
        <transition name="fade" mode="out-in">
          <div class="main-title" @click="goToTieba" v-if="showAvatar" :style="avatarPositionStyle" :key="`${selectedTieba?.id}-${currentBackgroundIndex}`">
            <div class="text-content" :style="textContentStyle" v-if="showTiebaName">
              <h1>{{ selectedTieba?.name || '加载中...' }}</h1>
              <p>{{ selectedTieba?.description || '正在加载贴吧信息...' }}</p>
            </div>
            <img v-if="selectedTieba?.avatar" :src="selectedTieba.avatar" :alt="selectedTieba.name" class="avatar-large">
            <div v-else class="avatar-placeholder">📷</div>
          </div>
        </transition>
      </div>
      <!-- 弹幕区域 -->
      <div class="danmaku-container">
        <VueDanmaku ref="danmakuRef" :danmus="[]" :loop="true" random-channel :debounce="debounce"
          :speeds="adaptiveSpeed" :autoResize="false">
          <template #danmu="{ danmu }">
            <span class="danmu-text" :data-color="getDanmakuStyle(danmu).text"
              :data-shadow-color="getDanmakuStyle(danmu).shadow" :style="getDanmakuInlineStyle(danmu)">
              {{ danmu.content }}
            </span>
          </template>
        </VueDanmaku>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import VueDanmaku from 'vue-danmaku'
import { Download, CaretLeft, CaretRight, Setting } from '@element-plus/icons-vue'
import { namedColorsList, defaultColor } from '../utils/colors.js'
import html2canvas from 'html2canvas'

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
const currentBackgroundIndex = ref(0)
const debounce = ref(200)
const showAvatar = ref(true)
const showDanmaku = ref(true)
const showTiebaName = ref(true)
const windowWidth = ref(window.innerWidth)
const settingsDialogVisible = ref(false)

// 弹幕颜色与阴影计算 - 从共享配置导入

const normalizeDanmakuColor = (value) => {
  if (!value) return defaultColor
  const lower = String(value).trim().toLowerCase()

  // 从 namedColorsList 中查找匹配的颜色
  const colorItem = namedColorsList.find(item =>
    item.value.toLowerCase() === lower
  )

  if (colorItem) return colorItem.value
  return defaultColor
}

const getContrastShadowColor = (hex) => {
  // 依据亮度选择黑/白阴影
  const h = (hex || defaultColor).replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 120 ? '#000000' : '#ffffff'
}

const getDanmakuStyle = (danmu) => {
  const hex = normalizeDanmakuColor(danmu?.color)
  const shadow = getContrastShadowColor(hex)
  return { text: hex, shadow }
}

const getDanmakuInlineStyle = (danmu) => {
  const { text, shadow } = getDanmakuStyle(danmu)
  return {
    color: text,
    textShadow: `-0.7px -0.7px 0.7px ${shadow}, 0.7px -0.7px 0.7px ${shadow}, -0.7px 0.7px 0.7px ${shadow}, 0.7px 0.7px 0.7px ${shadow}`
  }
}

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

// 计算是否可以切换背景图片（当背景图片数量大于1时）
const canSwitchCarousel = computed(() => {
  return props.selectedTieba?.backgroundImages?.length > 1
})

// 处理贴吧切换
const handleTiebaChange = (value) => {
  const selectedTieba = props.tiebaList.find(tieba => tieba.id === value)
  if (selectedTieba) {
    // 重置背景图片索引
    currentBackgroundIndex.value = 0
    emit('switchTieba', selectedTieba)
  }
}

// 切换到上一张背景图片
const prevCarousel = () => {
  const backgroundImages = props.selectedTieba?.backgroundImages
  if (backgroundImages && backgroundImages.length > 1) {
    currentBackgroundIndex.value = currentBackgroundIndex.value > 0 
      ? currentBackgroundIndex.value - 1 
      : backgroundImages.length - 1
    console.log('切换到第', currentBackgroundIndex.value, '张背景图片')
  }
}

// 切换到下一张背景图片
const nextCarousel = () => {
  const backgroundImages = props.selectedTieba?.backgroundImages
  if (backgroundImages && backgroundImages.length > 1) {
    currentBackgroundIndex.value = currentBackgroundIndex.value < backgroundImages.length - 1 
      ? currentBackgroundIndex.value + 1 
      : 0
    console.log('切换到第', currentBackgroundIndex.value, '张背景图片')
  }
}

// 处理弹幕显示/隐藏
const handleDanmakuVisibilityChange = (value) => {
  if (!danmakuRef.value) return

  if (value) {
    danmakuRef.value.show()
  } else {
    danmakuRef.value.hide()
  }
}

// 处理邮戳显示/隐藏
const handleAvatarChange = (value) => {
  // 如果邮戳被关闭，标题也自动关闭
  if (!value) {
    showTiebaName.value = false
  }
}

// 处理下载
const handleDownload = async () => {
  try {
    const contentElement = document.querySelector("#content")
    const rect = contentElement.getBoundingClientRect()
    
    const canvas = await html2canvas(contentElement, {
      width: rect.width,
      height: rect.height,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false
    })
    
    // 将canvas转换为blob
    canvas.toBlob((blob) => {
      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${props.selectedTieba?.name || '截图'}_${new Date().getTime()}.png`
      
      // 触发下载
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 清理URL对象
      URL.revokeObjectURL(url)
    }, 'image/png', 0.9)
  } catch (error) {
    console.error('下载失败:', error)
    alert('下载失败，请尝试系统截屏功能')
  }
}

// 重新加载所有弹幕的函数
const reloadDanmakus = (comments) => {
  if (!danmakuRef.value) return

  // 停止并清空现有弹幕
  danmakuRef.value.stop()

  // 设置debounce值
  var danmakuNum = comments.length
  if (danmakuNum < 30)
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
    content: comment.content,
    color: comment.color
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

// 监听窗口大小变化的处理函数
const handleResize = () => {
  windowWidth.value = window.innerWidth
  danmakuRef.value.resize()
}

// 生命周期钩子
onMounted(() => {
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

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 移除窗口大小变化监听器
  window.removeEventListener('resize', handleResize)
})

// 计算当前头像位置和展开方向
const currentAvatarPosition = computed(() => {
  console.log(props.selectedTieba, 'props.selectedTieba')
  const avatarPositions = props.selectedTieba?.avatarPosition
  if (avatarPositions && avatarPositions.length > 0) {
    return avatarPositions[currentBackgroundIndex.value] || avatarPositions[0]
  }
  return 'right-bottom' // 默认位置
})

// 计算头像位置样式
const avatarPositionStyle = computed(() => {
  const position = currentAvatarPosition.value
  console.log(position, '头像定位')
  const isLeft = position.startsWith('left')
  const baseStyle = {
    flexDirection: isLeft ? 'row-reverse' : 'row'
  }

  switch (position) {
    case 'left-up':
      return {
        ...baseStyle,
        top: 'var(--main-title-tb-margin)',
        left: 'var(--main-title-lr-margin)',
        right: 'auto',
        bottom: 'auto'
      }
    case 'left-bottom':
      return {
        ...baseStyle,
        top: 'auto',
        left: 'var(--main-title-lr-margin)',
        right: 'auto',
        bottom: 'var(--main-title-tb-margin)'
      }
    case 'right-bottom':
      return {
        ...baseStyle,
        top: 'auto',
        left: 'auto',
        right: 'var(--main-title-lr-margin)',
        bottom: 'var(--main-title-tb-margin)'
      }
    case 'right-up':
    default:
      return {
        ...baseStyle,
        top: 'var(--main-title-tb-margin)',
        left: 'auto',
        right: 'var(--main-title-lr-margin)',
        bottom: 'auto'
      }
  }
})

// 自适应弹幕速度计算
const adaptiveSpeed = computed(() => {
  if (windowWidth.value <= 400) {
    return 50
  } else if (windowWidth.value <= 768) {
    return 100
  } else {
    return 200
  }
})

// 响应式组件尺寸
const componentSize = computed(() => {
  return windowWidth.value <= 576 ? 'small' : 'default'
})

// 计算文本内容样式（根据头像位置调整展开方向）
const textContentStyle = computed(() => {
  const position = currentAvatarPosition.value
  const isLeft = position.startsWith('left')
  var useBlackFont = false
  const blackFonts = props.selectedTieba?.blackFonts

  if (blackFonts && blackFonts.length > 0) {
    useBlackFont = blackFonts[currentBackgroundIndex.value] === true
  }
  return {
    textAlign: isLeft ? 'left' : 'right',
    color: useBlackFont ? 'black' : 'white',
    textShadow: useBlackFont ? '0 0 4px white, 0 0 6px white, 0 0 8px white' : '2px 2px 4px rgba(0, 0, 0, 0.3)'
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
.main-area {
  margin: 0 2%;
  display: flex;
  flex-direction: column;
}

.content-area {
  position: relative;
  width: 100%;
  aspect-ratio: 12 / 7;
  margin: 15px 0;
  overflow: hidden;
}

.background-content {
  background: #ffffff;
  box-shadow: 0px 4px 8px 0px rgba(180, 233, 255, 0.45);
}

.main-title {
  position: absolute;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 2vw;
  z-index: 4;
  --main-title-lr-margin: 3vw;
  --main-title-tb-margin: 2.5vw;
}

.text-content h1 {
  margin: 0 0 0.4vw 0;
  font-size: clamp(15px, 3vw, 30px);
  font-weight: bold;
}

.text-content p {
  margin: 0 0 0.4vw 0;
  font-size: clamp(9px, 2vw, 20px);
  opacity: 0.9;
}

.avatar-large {
  width: 7vw;
  aspect-ratio: 1 / 1;
  border-radius: 1vw;
  border: 0.3vw solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0.4vw 2vw rgba(26, 117, 255, 0.3);
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 8vw;
  height: 8vw;
  max-width: 80px;
  max-height: 80px;
  min-width: 60px;
  min-height: 60px;
  border-radius: 1vw;
  /* background-color: rgba(255, 255, 255, 0.2); */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5em;
  color: white;
  border: 0.3vw solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0.4vw 2vw rgba(26, 117, 255, 0.3);
  flex-shrink: 0;
}

/* 弹幕容器 - 只覆盖banner图内容区域，不影响箭头点击和触摸滑动 */
.danmaku-container {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 4;
  overflow: hidden;
}

/* 弹幕文字样式 - 使用每条弹幕的动态颜色与阴影 */
:deep(.danmaku-container *) {
  font-size: clamp(12px, 2vw, 20px) !important;
  background: none;
  border: none !important;
}

/* 底部控制栏 */
.bottom-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: visible;
  flex-wrap: wrap;
}

.left-controls {
  display: flex;
  gap: 16px;
}

/* 贴吧选择器样式 */
.tieba-selector {
  display: flex;
  align-items: center;
  flex-shrink: 1;
  /* 允许缩小 */
  min-width: 0;
  /* 避免内容撑开父容器 */
}

::v-deep(.el-select__wrapper) {
  border: 1px solid #64D2FF;
  box-shadow: none;
}

::v-deep(.el-select__placeholder) {
  color: #409EFF;
}

.tieba-select {
  width: 150px;
  /* 默认宽度 */
  max-width: 100%;
  /* 避免超出父容器 */
  min-width: 80px;
  /* 移动端最小宽度 */
  flex-grow: 1;
  /* 可以按比例扩展 */
}

/* 背景图片样式 */
.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.6s ease-in-out;
}

.background-image.active {
  opacity: 1;
}


.switch-item {
  padding: 3px 0;
}


.switch-label {
  font-size: 14px;
  color: #606266;
  margin-right: 15px;
}

/* Switch 开关样式自定义 */
:deep(.el-switch) {
  --el-switch-on-color: #409eff;
  --el-switch-off-color: #b4cdd8;
}

:deep(.el-switch__core) {
  border-color: rgba(255, 255, 255, 0.3);
}

/* 下载控制样式 */
.download-controls {
  display: flex;
  align-items: center;
  overflow: visible;
}

.icon-large {
  font-size: 24px;
}

/* 按钮组分割线颜色与边框一致 */
:deep(.el-button-group .el-button) {
  --el-button-divide-border-color: var(--el-button-border-color);
}

/* 淡入淡出过渡效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.6s ease-in-out;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.fade-enter-to, .fade-leave-from {
  opacity: 1;
}

</style>