<template>
  <div class="main-area" :style="mainAreaStyle">

    <div class="main-title" @click="goToTieba">
      <div class="text-content">
        <h1>{{ selectedTieba.name}}</h1>
        <p>{{ selectedTieba.description }}</p>
      </div>
      <img :src="selectedTieba.avatar" :alt="selectedTieba.name" class="avatar-large">
    </div>

    <!-- 弹幕区域 - 显示在main-title下方 -->
    <div class="danmaku-container">
      <VueDanmaku ref="danmakuRef" :danmus="[]" loop random-channel :channels="8" :debounce="2000" :isSuspend="true">
        <template #danmu="{ danmu }"> {{ danmu.content }} </template>
      </VueDanmaku>
    </div>

    <!-- 背景下载按钮 -->
    <a class="background-download-btn" :href="selectedTieba.backgroundImage || selectedTieba.avatar"
      :download="selectedTieba.name + '背景图.jpg'" @click.stop title="下载背景图">
      <svg class="download-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 向下箭头 -->
        <path d="M12 3L12 15M12 15L8 11M12 15L16 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" />
        <!-- U形托盘 -->
        <path d="M6 16L8 18L16 18L18 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" fill="none" />
      </svg>
    </a>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import VueDanmaku from 'vue-danmaku'

// Props
const props = defineProps({
  selectedTieba: {
    type: Object,
    required: true
  },
  isPlaying: {
    type: Boolean,
    default: false
  }
})

const danmakuRef = ref(null)

// 重新加载所有弹幕的函数
const reloadDanmakus = (comments) => {
  if (!danmakuRef.value) return
  
  // 停止并清空现有弹幕
  danmakuRef.value.stop()
  
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

// 计算属性
const mainAreaStyle = computed(() => {
  if (props.selectedTieba.backgroundImage) {
    return { background: `url('${props.selectedTieba.backgroundImage}') center/cover` }
  } else {
    return { background: 'linear-gradient(45deg, #1a75ff, #4da6ff)' }
  }
})

function goToTieba() {
  const tiebaName = encodeURIComponent(props.selectedTieba.name.slice(0, -1))
  const url = `https://tieba.baidu.com/f?kw=${tiebaName}`
  window.open(url, '_blank')
}

</script>

<style scoped>
/* 主体区域 - 支持图片背景 */
.main-area {
  position: relative;
  width: 100%;
  height: 500px;
  background: linear-gradient(45deg, #1a75ff, #4da6ff);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(26, 117, 255, 0.2);
  overflow: hidden;
  margin-bottom: 30px;
  transition: transform 0.2s ease;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.main-area:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(26, 117, 255, 0.3);
}

/* 主体区域背景下载按钮 */
.main-area .background-download-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(26, 117, 255, 0.3);
  color: white;
  text-decoration: none;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.main-area:hover .background-download-btn {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.main-area .background-download-btn:hover {
  background: rgba(26, 117, 255, 0.5);
  transform: translateY(-2px);
}

.main-area .background-download-btn .download-icon {
  width: 16px;
  height: 16px;
}

.main-area .background-download-btn:hover .download-icon {
  transform: scale(1.1);
}

.main-title {
  position: relative;
  top: 30px;
  right: 30px;
  text-align: right;
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  z-index: 5;
  align-self: flex-end;
  margin-right: 30px;
}

.text-content {
  text-align: right;
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
  border: 3px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 20px rgba(26, 117, 255, 0.3);
  flex-shrink: 0;
}

/* 弹幕容器 */
.danmaku-container {
  flex: 1;
  position: relative;
  height: 300px;
  width: 100%;
  margin-top: 80px;
  margin-bottom: 20px;
  z-index: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-area {
    height: 400px;
  }
  
  .text-content h1 {
    font-size: 1.8em;
  }
  
  .danmaku-container {
    height: 200px;
  }
}
</style>