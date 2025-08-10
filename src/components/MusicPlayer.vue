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
    order: 'list',
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

  // 鼠标悬浮展开/收起功能
  aplayerContainer.addEventListener('mouseenter', () => {
    aplayer.value.setMode('normal')
  })
  
  aplayerContainer.addEventListener('mouseleave', () => {
    aplayer.value.setMode('mini')
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
    aplayer.value.list.switch(0)
    if (wasPlaying) {
      aplayer.value.play()
    }
  }
}

// 监听selectedTieba变化
watch(() => props.selectedTieba, () => {
  updatePlayer()
}, { deep: true })

// 生命周期
onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  if (aplayer.value) {
    aplayer.value.destroy()
  }
})

// 暴露方法给父组件
defineExpose({
  updatePlayer,
  aplayer
})
</script> 

<style>
/* APlayer 样式调整 */
.aplayer .aplayer-narrow,
.aplayer-narrow .aplayer-body {
  background: transparent !important;
} 

.aplayer-body {
  padding-right: 8px !important;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(10px) !important;
}

.aplayer-pic {
  position: relative !important;
  width: 46px !important;
  height: 46px !important;  
  border-radius: 50% !important;
  background: radial-gradient(circle at 60% 40%, #444 60%, #222 100%);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  overflow: visible !important;
  border: 10px solid #222; 
  transition: transform 0.3s ease;
}

.aplayer-pic img {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 4px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  object-fit: cover;
  background: #fff;
}

.aplayer-playing img {
  animation: vinyl-spin 4s linear infinite;
}

.aplayer-playing .aplayer-pic,
.aplayer.aplayer-playing .aplayer-pic,
.aplayer .aplayer-pic.playing {
  animation: vinyl-spin 4s linear infinite;
}

.aplayer-pic .aplayer-button,
.aplayer-icon-lrc, .aplayer-icon-back, .aplayer-icon-forward, .aplayer-icon-play, .aplayer-miniswitcher,.aplayer-icon-order {
  display: none !important;
} 

@keyframes vinyl-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 