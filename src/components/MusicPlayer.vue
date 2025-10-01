<template>
  <div id="aplayer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import APlayer from 'aplayer'

// Props
const props = defineProps({
  selectedTieba: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['music-state-change'])

// 响应式数据
const aplayer = ref(null)

// 初始化播放器
const initPlayer = () => {
  if (aplayer.value) {
    aplayer.value.destroy()
  }

  // 获取歌曲数组
  const songs = props.selectedTieba.songs || []

  if (songs.length === 0) {
    console.warn('没有找到歌曲数据')
    return
  }

  aplayer.value = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true,
    autoplay: false,
    theme: '#1a75ff',
    loop: 'all',
    order: 'random',
    preload: 'auto',
    volume: 0.7,
    mutex: true,
    listFolded: true,
    lrcType: 0,
    audio: songs
  })

  // 监听播放状态
  const aplayerContainer = document.getElementById('aplayer')

  aplayer.value.on('play', () => {
    aplayerContainer.classList.add('aplayer-playing')
    emit('music-state-change', true)
  })

  aplayer.value.on('pause', () => {
    aplayerContainer.classList.remove('aplayer-playing')
    emit('music-state-change', false)
  })

  aplayer.value.on('ended', () => {
    aplayerContainer.classList.remove('aplayer-playing')
    emit('music-state-change', false)
  })

  aplayer.value.on('error', () => {
    aplayerContainer.classList.remove('aplayer-playing')
    emit('music-state-change', false)
  })

  // 阻止播放器内部点击事件冒泡
  aplayerContainer.addEventListener('click', (event) => {
    event.stopPropagation()
  })
}

// 更新播放器
const updatePlayer = () => {
  if (aplayer.value) {
    const wasPlaying = !aplayer.value.audio.paused

    // 获取歌曲数组
    const songs = props.selectedTieba.songs || []

    if (songs.length === 0) {
      console.warn('没有找到歌曲数据')
      return
    }

    aplayer.value.list.clear()
    aplayer.value.list.add(songs)
    if (wasPlaying) {
      aplayer.value.play()
    }
  }
}

// 监听selectedTieba的id变化
watch(() => props.selectedTieba?.id, () => {
  updatePlayer()
})

// 点击外部区域收起播放器
const handleClickOutside = (event) => {
  if (aplayer.value) {
    const aplayerContainer = document.getElementById('aplayer')
    if (aplayerContainer && !aplayerContainer.contains(event.target)) {
      aplayer.value.list.hide()
      aplayer.value.setMode('mini')
    }
  }
}

// 生命周期
onMounted(() => {
  initPlayer()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (aplayer.value) {
    aplayer.value.destroy()
  }
  // 移除事件监听器
  document.removeEventListener('click', handleClickOutside)
})

// 暴露方法给父组件
defineExpose({
  updatePlayer,
  aplayer
})
</script>

<style>

.aplayer-fixed {
  background: transparent !important;
}

.aplayer-body {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(10px) !important;
}

.aplayer-list {
  background: #fff;
}

.aplayer-pic {
  position: relative !important;
  width: 46px !important;
  height: 46px !important;
  border-radius: 50% !important;
  background: radial-gradient(circle at 60% 40%, #444 60%, #222 100%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  overflow: visible !important;
  border: 10px solid #222;
  transition: transform 0.3s ease;
}

.aplayer-playing .aplayer-pic,
.aplayer.aplayer-playing .aplayer-pic,
.aplayer .aplayer-pic.playing {
  animation: vinyl-spin 4s linear infinite;
}

/* 让按钮不跟随父元素旋转 */
.aplayer-pause {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
}

.aplayer-icon-lrc,
.aplayer-icon-back,
.aplayer-icon-forward,
.aplayer-icon-play,
.aplayer-icon-order {
  display: none !important;
}

@keyframes vinyl-spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

</style>