<template>
  <div class="main-area">
    <!-- 底部控制栏 -->
    <div class="bottom-controls">
      <div class="left-controls">
        <!-- 贴吧选择器 -->
        <div class="tieba-selector">
          <el-select v-model="selectedTiebaId" @change="handleTiebaChange" placeholder="选择贴吧" class="tieba-select"
            size="default">
            <el-option v-for="item in tiebaList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </div>
        <!-- 显示控制 -->
        <div class="display-controls">
          <div class="switch-item">
            <span class="switch-label">邮戳</span>
            <el-switch v-model="showAvatar" class="show-in-pc" />
            <el-switch size="small" v-model="showAvatar" class="show-in-media" />
          </div>
          <div class="switch-item">
            <span class="switch-label">弹幕</span>
            <el-switch v-model="showDanmaku" @change="handleDanmakuVisibilityChange" class="show-in-pc" />
            <el-switch size="small" v-model="showDanmaku" @change="handleDanmakuVisibilityChange"
              class="show-in-media" />
          </div>
        </div>
      </div>
      <!-- 下载控制 -->
      <div class="download-controls"
        v-if="(selectedTieba?.backgroundImages && selectedTieba.backgroundImages.length > 0) || selectedTieba?.avatar">
        <el-button :icon="Download" @click="handleDownload" class="show-in-pc">
          下载
        </el-button>
        <el-button :icon="Download" @click="handleDownload" class="show-in-media"></el-button>
      </div>
    </div>
    <!-- 内容区域 - 包含头像和弹幕 -->
    <div class="content-area">
      <!-- 背景图片轮播 - 覆盖整个content-area -->
        <el-carousel :trigger="windowWidth <= 768 ? 'click' : 'hover'"
          :arrow="selectedTieba?.backgroundImages?.length > 1 ? 'always' : 'never'" height="100%" :autoplay="false"
          indicator-position="none" :touch="true" @change="handleCarouselChange">
          <el-carousel-item v-for="(image, index) in selectedTieba.backgroundImages" indicator-position="none"
            :key="index">
            <img :src="image" alt="" class="carousel-image" />
          </el-carousel-item>
        </el-carousel>
      <div class="main-title" @click="goToTieba" v-if="showAvatar" :style="avatarPositionStyle">
        <div class="text-content" :style="textContentStyle">
          <h1>{{ selectedTieba?.name || '加载中...' }}</h1>
          <p>{{ selectedTieba?.description || '正在加载贴吧信息...' }}</p>
        </div>
        <img v-if="selectedTieba?.avatar" :src="selectedTieba.avatar" :alt="selectedTieba.name" class="avatar-large">
        <div v-else class="avatar-placeholder">📷</div>
      </div>
      <!-- 弹幕区域 -->
      <div class="danmaku-container">
        <VueDanmaku ref="danmakuRef" :danmus="[]" :loop="true" random-channel :debounce="debounce" :isSuspend="true"
          :speeds="adaptiveSpeed">
          <template #danmu="{ danmu }">
            <span
              class="danmu-text"
              :data-color="getDanmakuStyle(danmu).text"
              :data-shadow-color="getDanmakuStyle(danmu).shadow"
              :style="getDanmakuInlineStyle(danmu)"
            >
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
import { Download } from '@element-plus/icons-vue'
import { namedColorsList, defaultColor } from '../utils/colors.js'

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
const showAvatar = ref(true)
const showDanmaku = ref(true)
const windowWidth = ref(window.innerWidth)

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
  console.log('轮播图切换到第', index, '张')
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

// 处理下载
const handleDownload = async () => {
  await downloadBackground(showAvatar.value, showDanmaku.value)
}

// 下载背景图功能
const downloadBackground = async (showAvatar, showDanmaku) => {
  const backgroundImages = props.selectedTieba?.backgroundImages
  const currentIndex = props.selectedTieba?.currentBackgroundIndex || 0

  if (!backgroundImages && !props.selectedTieba?.avatar) {
    return
  }

  const backgroundImageUrl = (backgroundImages && backgroundImages.length > 0)
    ? (backgroundImages[currentIndex] || backgroundImages[0])
    : props.selectedTieba.avatar

  // 根据显示邮戳和弹幕的状态生成文件名
  let fileName = props.selectedTieba.name
  if (showAvatar && showDanmaku) {
    fileName += '_含邮戳和弹幕'
  } else if (showAvatar) {
    fileName += '_含邮戳'
  } else if (showDanmaku) {
    fileName += '_含弹幕'
  } else {
    fileName += '_纯背景'
  }

  // 检测原始图片格式
  const getImageExtension = (url) => {
    const urlLower = url.toLowerCase()
    if (urlLower.includes('.png')) return '.png'
    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return '.jpg'
    if (urlLower.includes('.webp')) return '.webp'
    if (urlLower.includes('.gif')) return '.gif'
    // 默认返回.jpg
    return '.jpg'
  }

  // 如果是直接下载原图，保持原始格式；否则使用jpg（因为合成图片固定为jpg）
  const shouldKeepOriginalFormat = !showAvatar && !showDanmaku
  if (shouldKeepOriginalFormat) {
    fileName += getImageExtension(backgroundImageUrl)
  } else {
    fileName += '.jpg'
  }

  try {
    if (showAvatar && props.selectedTieba?.avatar) {
      // 需要合成图片（包含头像和弹幕）
      await createCompositeImage(backgroundImageUrl, props.selectedTieba.avatar, fileName, showDanmaku)
    } else if (showDanmaku) {
      // 只包含弹幕，不包含头像
      await createCompositeImage(backgroundImageUrl, null, fileName, showDanmaku)
    } else {
      // 直接下载原图
      const link = document.createElement('a')
      link.href = backgroundImageUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('下载图片失败:', error)
    // 如果合成失败，回退到直接下载
    const link = document.createElement('a')
    link.href = backgroundImageUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// 绘制弹幕到Canvas
const drawDanmakus = (ctx, canvas, scale) => {
  if (!danmakuRef.value || !danmakuRef.value.dmContainer) {
    return
  }

  // 获取当前屏幕上的弹幕元素
  const danmuElements = danmakuRef.value.dmContainer.getElementsByClassName('dm')

  // 设置弹幕样式（与网页样式一致）
  const baseFontSize = 20 * scale // 20px * scale
  ctx.font = `${baseFontSize}px "Microsoft YaHei", sans-serif`
  ctx.textBaseline = 'top'

  // 绘制每个弹幕
  for (let i = 0; i < danmuElements.length; i++) {
    const danmuEl = danmuElements[i]

    // 获取弹幕内容
    const content = danmuEl.textContent || danmuEl.innerText || ''
    if (!content.trim()) continue

    // 获取弹幕位置信息
    const channelIndex = parseInt(danmuEl.dataset.channel) || 0
    const top = parseFloat(danmuEl.style.top) || 0

    // 计算弹幕在Canvas中的位置
    const danmuHeight = 20 * scale // 弹幕高度：20 * 1.92 = 38.4
    const danmuTop = 4 * scale // 弹幕间距：4 * 1.92 = 7.68
    // 考虑最外层border的偏移（1px）
    // 网页中main-area有1px border，导致内容向内缩进1px
    const borderOffset = 8
    const y = top * scale + borderOffset // 垂直位置按比例缩放，然后加上border偏移

    // 计算弹幕的水平位置（根据当前移动进度）
    let x = canvas.width // 默认从右侧开始

    // 获取弹幕的当前transform位置
    const transform = danmuEl.style.transform
    if (transform && transform.includes('translateX')) {
      const match = transform.match(/translateX\(([^)]+)px\)/)
      if (match) {
        const translateX = parseFloat(match[1])
        // 计算弹幕在Canvas中的水平位置
        // 网页容器宽度1000px，Canvas宽度1920px，比例1.92
        // 考虑最外层border的偏移（1px）
        const borderOffset = 1 * scale // 1px * 1.92 = 1.92px
        x = canvas.width + (translateX * scale) + borderOffset
      }
    }

    // 如果弹幕已经移出屏幕左侧，跳过绘制
    if (x < -200 * scale) continue

    // 取出网页节点上的颜色与阴影颜色（从子元素 .danmu-text 上读取）
    const textNode = danmuEl.querySelector('.danmu-text')
    const textColor = (textNode && textNode.getAttribute('data-color')) || 'white'
    const shadowColor = (textNode && textNode.getAttribute('data-shadow-color')) || 'black'

    // 绘制弹幕文字阴影（与网页样式一致）
    ctx.save()
    ctx.shadowColor = shadowColor
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 1 * scale
    ctx.shadowOffsetY = 1 * scale
    ctx.fillStyle = textColor
    ctx.fillText(content, x, y)

    // 绘制第二层阴影
    ctx.shadowOffsetX = -1 * scale
    ctx.shadowOffsetY = 1 * scale
    ctx.fillText(content, x, y)

    // 绘制第三层阴影
    ctx.shadowOffsetX = 1 * scale
    ctx.shadowOffsetY = -1 * scale
    ctx.fillText(content, x, y)

    // 绘制第四层阴影
    ctx.shadowOffsetX = -1 * scale
    ctx.shadowOffsetY = -1 * scale
    ctx.fillText(content, x, y)

    // 绘制主文字
    ctx.shadowColor = 'transparent'
    ctx.fillStyle = textColor
    ctx.fillText(content, x, y)
    ctx.restore()
  }
}

// 创建合成图片
const createCompositeImage = async (backgroundUrl, avatarUrl, fileName, showDanmaku) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // 设置画布尺寸（可以根据需要调整）
    canvas.width = 1920
    canvas.height = 1080

    // 加载背景图片
    const backgroundImg = new Image()
    backgroundImg.crossOrigin = 'anonymous'
    backgroundImg.onload = () => {
      // 绘制背景图片（保持比例，居中显示）
      const scale = Math.max(canvas.width / backgroundImg.width, canvas.height / backgroundImg.height)
      const scaledWidth = backgroundImg.width * scale
      const scaledHeight = backgroundImg.height * scale
      const x = (canvas.width - scaledWidth) / 2
      const y = (canvas.height - scaledHeight) / 2

      ctx.drawImage(backgroundImg, x, y, scaledWidth, scaledHeight)

      // 如果没有头像，直接绘制弹幕
      if (!avatarUrl) {
        if (showDanmaku) {
          // 使用固定的网页到Canvas比例，而不是背景图片的scale
          drawDanmakus(ctx, canvas, 1.92)
        }

        // 转换为blob并下载
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          resolve()
        }, 'image/jpeg', 0.9)
        return
      }

      // 加载头像
      const avatarImg = new Image()
      avatarImg.crossOrigin = 'anonymous'
      avatarImg.onload = () => {
        // 计算头像位置（模拟邮戳效果，与网页样式一致）
        // 网页展示框1000px，canvas 1920px，比例1.92
        const scale = 1.92
        const avatarSize = 80 * scale // 头像大小：80 * 1.92 = 153.6
        const margin = 30 * scale // 边距：40 * 1.92 = 76.8
        let avatarX, avatarY

        // 根据当前头像位置计算邮戳位置
        const currentPosition = currentAvatarPosition.value
        switch (currentPosition) {
          case 'left-bottom':
            avatarX = margin
            avatarY = canvas.height - margin - avatarSize
            break
          case 'left-up':
            avatarX = margin
            avatarY = margin
            break
          case 'right-up':
            avatarX = canvas.width - margin - avatarSize
            avatarY = margin
            break
          case 'right-bottom':
            avatarX = canvas.width - margin - avatarSize
            avatarY = canvas.height - margin - avatarSize
            break
          default:
            avatarX = margin
            avatarY = margin
        }

        // 绘制头像背景（方形，带阴影效果，与网页样式一致）
        ctx.save()
        ctx.shadowColor = 'rgba(26, 117, 255, 0.3)'
        ctx.shadowBlur = 20 * scale // 阴影模糊：20 * 1.92 = 38.4
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4 * scale // 阴影偏移：4 * 1.92 = 7.68

        // 绘制方形头像背景（圆角矩形）
        ctx.beginPath()
        ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 10 * scale) // 圆角：10 * 1.92 = 19.2
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.fill()
        ctx.restore()

        // 绘制弹幕（如果需要）- 在头像之前绘制，确保弹幕在头像下层
        if (showDanmaku) {
          drawDanmakus(ctx, canvas, 1.92)
        }

        // 绘制头像图片
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(avatarX + 3 * scale, avatarY + 3 * scale, avatarSize - 6 * scale, avatarSize - 6 * scale, 7 * scale) // 内边距和圆角都按比例缩放
        ctx.clip()
        ctx.drawImage(avatarImg, avatarX + 3 * scale, avatarY + 3 * scale, avatarSize - 6 * scale, avatarSize - 6 * scale)
        ctx.restore()

        // 添加邮戳边框（与网页样式一致）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 3 * scale // 边框宽度：3 * 1.92 = 5.76
        ctx.beginPath()
        ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 10 * scale)
        ctx.stroke()

        // 转换为blob并下载
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          resolve()
        }, 'image/jpeg', 0.9)
      }

      avatarImg.onerror = () => {
        reject(new Error('头像加载失败'))
      }
      avatarImg.src = avatarUrl
    }

    backgroundImg.onerror = () => {
      reject(new Error('背景图片加载失败'))
    }
    backgroundImg.src = backgroundUrl
  })
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

  // 监听窗口大小变化
  const handleResize = () => {
    windowWidth.value = window.innerWidth
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 移除窗口大小变化监听器
  window.removeEventListener('resize', () => {
    windowWidth.value = window.innerWidth
  })
})

// 计算属性
const contentAreaStyle = computed(() => {
  const backgroundImages = props.selectedTieba?.backgroundImages
  const currentIndex = props.selectedTieba?.currentBackgroundIndex || 0

  if (backgroundImages && backgroundImages.length > 0) {
    const currentBackground = backgroundImages[currentIndex] || backgroundImages[0]
    return { background: `url('${currentBackground}') left top/cover` }
  } else {
    return { background: 'linear-gradient(45deg, #1a75ff, #4da6ff)' }
  }
})

// 计算当前头像位置和展开方向
const currentAvatarPosition = computed(() => {
  console.log(props.selectedTieba,'props.selectedTieba')
  const avatarPositions = props.selectedTieba?.avatarPosition
  const currentIndex = props.selectedTieba?.currentBackgroundIndex || 0
  if (avatarPositions && avatarPositions.length > 0) {
    return avatarPositions[currentIndex] || avatarPositions[0]
  }
  return 'right-bottom' // 默认位置
})

// 计算头像位置样式
const avatarPositionStyle = computed(() => {
  const position = currentAvatarPosition.value
  console.log(position,'头像定位')
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

// 计算文本内容样式（根据头像位置调整展开方向）
const textContentStyle = computed(() => {
  const position = currentAvatarPosition.value
  const isLeft = position.startsWith('left')
  var useBlackFont = false
  const blackFonts = props.selectedTieba?.blackFonts
  const currentIndex = props.selectedTieba?.currentBackgroundIndex || 0

  if (blackFonts && blackFonts.length > 0) {
    useBlackFont = blackFonts[currentIndex] === true
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
/* 主体区域 */
.main-area {
  position: relative;
  width: 100%;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.content-area {
  flex: 1;
  margin-top: 18px;
  position: relative;
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;

}

.background-content {
  padding: 25px;
  background: #ffffff;
  box-shadow: 0px 4px 8px 0px rgba(180, 233, 255, 0.45);
  border-radius: 20px;
}


.main-title {
  position: absolute;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  z-index: 4;
  --main-title-margin: 0px;
  --main-title-lr-margin: 135px;
    --main-title-tb-margin: 65px;
  --main2-title-margin: 132px;
  --main3-title-margin: 60px;
  --main4-title-margin: 132px;
  transition: z-index 0s; /* 确保z-index变化有过渡效果 */
}

/* 鼠标悬浮时提高层级 */
.main-title:hover {
  z-index: 5;
}

/* 扩大邮戳的悬浮区域，增加一个透明的悬浮区域 */
.main-title::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  z-index: 1;
  pointer-events: auto;
}

/* 隐藏默认箭头图标 */
:deep(.el-carousel__arrow i) {
  display: none !important;
}

/* 使用伪元素添加图片 */
:deep(.el-carousel__arrow--left)::before,
:deep(.el-carousel__arrow--right)::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.57;
}

:deep(.el-carousel__arrow--left)::before {
  background-image: url("/assets/backgrounds/left-arrow.png");
}

:deep(.el-carousel__arrow--right)::before {
  background-image: url("/assets/backgrounds/right-arrow.png");
}

.text-content {
  opacity: 0;
  transition: all 0.3s ease;
}

.main-title:hover .text-content {
  opacity: 1;
}

.text-content h1 {
  margin: 0 0 10px 0;
  font-size: 2.5em;
  font-weight: bold;
}

.text-content p {
  margin: 0;
  font-size: 1.2em;
  opacity: 0.9;
}

.avatar-large {
  width: 8vw;
  height: 8vw;
  max-width: 80px;
  max-height: 80px;
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

::deep(.el-carousel__indicators) {
  display: none !important;
}

/* 弹幕容器 - 只覆盖banner图内容区域，不影响箭头点击和触摸滑动 */
.danmaku-container {
  position: absolute;
  top: calc(15px + 20px); /* 距离图片顶部20px */
  left: 75px; /* 对应 .el-carousel 的 padding: 0 75px */
  width: calc(100% - 150px); /* 总宽度减去左右各75px的padding */
  height: calc(100% - 40px - 61px); /* 总高度减去上下各20px的边距，还有轮播图多出来的61px */
  z-index: 4;
  /* 放在图片上层，但在头像下层 */
  pointer-events: none;
  /* 关键：不拦截鼠标事件和触摸事件 */
  touch-action: none;
  /* 确保触摸事件能正确传递给轮播图 */
  border-radius: 16px; /* 匹配 carousel-image 的圆角 */
  overflow: hidden; /* 确保弹幕不会超出圆角边界 */
}


.danmu-text {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px 20px;
  border-radius: 100px
}

/* 隐藏默认图标 */
:deep(.el-carousel__arrow i) {
  display: inline;
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
  padding: 0 95px;
  /* border-radius: 10px; */
  overflow: visible;
  flex-wrap: wrap;
}

.left-controls {
  display: flex;
  gap: 16px;
}

::v-deep(.el-carousel__arrow svg) {
  stroke-width: 3;
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
  color: #30B5EE;
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

/* 背景图片轮播样式 */
.background-carousel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
}
::v-deep .el-carousel__item{
  /* top:50%;
  transform: translateY(-50%); */
  padding: 0 !important;
  margin: 0 !important;
}
.carousel-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 16px;
}

/* 确保轮播图箭头相对于content-area定位 */
:deep(.el-carousel) {
  position: absolute;
  top: 15px;
  bottom: 0;
  left: 0;
  right: 0;
}

:deep(.el-carousel__arrow) {
  background: #30b5ee;
}

:deep(.el-carousel--horizontal,
  .el-carousel--vertical) {
  padding: 0 75px;
}

/* 显示控制样式 */
.display-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.switch-item {
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1px solid #64D2FF;
  padding: 0 5px;
  border-radius: 5px;
  background: #ffffff;
}

.switch-label {
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  color: #30B5EE;
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

::v-deep(.el-button) {
  border: 1px solid #64D2FF;
  box-shadow: none;
  background: #ffffff;
  color: #30B5EE;
}

/* PC端显示带文字的按钮，移动端隐藏 */
.show-in-pc {
  display: inline-flex;
}

/* 移动端显示只带图标的按钮，PC端隐藏 */
.show-in-media {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  /* 移动端弹幕容器调整 */
  .danmaku-container {
    top: 8px; /* 对应移动端 content-area margin-top: 8px */
    left: 10px; /* 对应移动端轮播图 padding: 0 6px + background-content padding: 4px */
    right: 10px; /* 对应移动端轮播图 padding: 0 6px + background-content padding: 4px */
    bottom: 8px; /* 对应移动端底部间距 */
    border-radius: 4px; /* 匹配移动端 background-content 的圆角 */
  }
  .main-title {
    --main-title-margin: 0px;
    --main-title-lr-margin: 15px;
    --main-title-tb-margin: 15px;
    /* --main-title-margin: 158px; */
    --main2-title-margin: 14px;
    --main3-title-margin: -26px;
    --main4-title-margin: 282px;
  }

  /* 移动端轮播图箭头样式 - 显示但优化样式 */
  :deep(.el-carousel__arrow) {
    display: flex !important;
    width: 32px;
    height: 32px;
    background: rgba(48, 181, 238, 0.8);
    border-radius: 50%;
    backdrop-filter: blur(4px);
  }
  
  /* 确保箭头在移动端更容易点击且位置合适 */
  :deep(.el-carousel__arrow--left) {
    left: 16px;
  }
  
  :deep(.el-carousel__arrow--right) {
    right: 16px;
  }

  .bottom-controls {
    padding: 0;
  }

  .content-area {
    margin-top: 8px;
  }

  :deep(.el-carousel--horizontal,
    .el-carousel--vertical) {
    padding: 0 6px;
  }

  .background-content {
    padding: 4px;
    border-radius: 4px;
  }

  .left-controls {
    gap: 6px;
  }

  .display-controls {
    gap: 6px;
  }

  .switch-item {
    gap: 4px;
  }

  .switch-label {
    font-size: 12px;
  }

  :deep(.el-switch) {
    height: 28px;
    line-height: 16px;
  }

  /* :deep(.el-switch__core) {
    min-width: 20px;
    height: 10px;
    border-radius: 5px;
  }

  :deep(.el-switch__action) {
    width: 8px;
    height: 8px;
    left: calc(100% - 9px);
  } */

  ::v-deep(.el-button) {
    height: 28px;
    padding: 8px;
  }

  ::v-deep(.el-icon) {
    font-size: large;
  }

  .text-content h1 {
    font-size: 1.8em;
  }

  .tieba-select {
    width: 80px;
    /* 按屏幕宽度缩小 */
    min-width: 133px;
  }

  .carousel-image {
    border-radius: 4px;
    aspect-ratio: 16 / 7;
    object-fit: cover;
  }

  ::v-deep(.el-select__wrapper) {
    border: 1px solid #64D2FF;
    box-shadow: none;
    min-height: 28px;
    font-size: 12px;
  }

  ::v-deep(.el-select__placeholder) {
    color: #30B5EE;
  }

  /* 在768px以下，PC端按钮隐藏，移动端按钮显示 */
  .show-in-pc {
    display: none;
  }

  .show-in-media {
    display: inline-flex;
  }
}

@media (max-width: 480px) {
  /* 小屏幕轮播图箭头样式 - 稍微小一些 */
  :deep(.el-carousel__arrow) {
    display: flex !important;
    width: 28px;
    height: 28px;
    background: rgba(48, 181, 238, 0.9);
    border-radius: 50%;
    backdrop-filter: blur(4px);
  }
  
  :deep(.el-carousel__arrow--left) {
    left: 12px;
  }
  
  :deep(.el-carousel__arrow--right) {
    right: 12px;
  }

  .bottom-controls {
    padding: 0;
  }

  /* 小屏幕弹幕容器调整 */
  .danmaku-container {
    top: 8px; /* 对应小屏幕 content-area margin-top: 8px */
    left: 10px; /* 对应小屏幕轮播图 padding: 0 6px + background-content padding: 4px */
    right: 10px; /* 对应小屏幕轮播图 padding: 0 6px + background-content padding: 4px */
    bottom: 8px; /* 对应小屏幕底部间距 */
    border-radius: 4px; /* 匹配小屏幕 background-content 的圆角 */
  }

  .carousel-image {
    border-radius: 4px;
    aspect-ratio: 16 / 7;
    object-fit: cover;
  }

  .content-area {
    margin-top: 8px;
  }

  .background-content {
    padding: 4px;
    border-radius: 4px;
  }

  .left-controls {
    gap: 6px;
  }

  .display-controls {
    gap: 6px;
  }

  .switch-item {
    gap: 4px;
  }

  :deep(.el-carousel--horizontal,
    .el-carousel--vertical) {
    padding: 0 6px;
  }

  .switch-label {
    font-size: 12px;
  }

  /* :deep(.el-switch__core) {
    border-color: rgba(255, 255, 255, 0.3);
  }

  :deep(.el-switch__action) {
    width: 8px;
    height: 8px;
    left: calc(100% - 9px);
  } */

  ::v-deep(.el-button) {
    margin: 0;
    height: 28px;
    padding: 8px;
  }

  ::v-deep(.el-icon) {
    font-size: large;
  }

  :deep(.el-switch) {
    height: 28px;
    line-height: 16px;
  }

  .tieba-select {
    width: 80px;
    /* 按屏幕宽度缩小 */
    min-width: 133px;
  }

  .avatar-large,
  .avatar-placeholder {
    width: 12vw;
    height: 12vw;
    max-width: 60px;
    max-height: 60px;
  }

  .text-content h1 {
    font-size: 1.5em;
  }

  .text-content p {
    font-size: 1em;
  }
}
</style>
