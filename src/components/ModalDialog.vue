<template>
  <div class="modal-overlay" :class="{ show: visible }" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <img src="/assets/backgrounds/popupIcon-big.png" class="user-img show-in-pc" alt="">
      <img src="/assets/backgrounds/popupIcon-big.png" class="user-img show-in-media" alt="">
      <!-- <img src="/assets/backgrounds/close-button.png" @click="$emit('close')" class="close-btn" alt=""> -->
      <!-- 网站信息内容 -->
      <div class="modal-info">
        <p class="modal-text">
          本网站由百度贴吧<b>原神天堂内鬼吧</b>牵头，联合 14 个游戏主题贴吧共同搭建，是专为玩家打造的粉丝同人纪念平台。内容上以玩家自由发布的弹幕为核心，同时记录百度贴吧玩家社区的重要发展节点，见证社群成长中的精彩瞬间。
        </p>
        <p class="modal-text">
          本网站全程无广告、付费订阅、商品销售等商业变现行为，无任何经济利益获取目的，既是玩家交流空间，更承载着民间社区的纪念价值，助力维系同好联结。此外，网站所有内容均为玩家自主创作分享，不代表游戏官方立场，也不承担官方信息发布职能；始终以维护积极友好的交流氛围为原则，鼓励玩家合规合法文明分享。
        </p>
        <div class="modal-stats" v-loading="isStatsLoading" element-loading-background="rgba(255, 255, 255, 0.8)">
          <div class="stat-row">
            <span class="stat-label">访问量</span>
            <span class="stat-value">{{ stats.clickCount }} 次</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">用户量</span>
            <span class="stat-value">{{ stats.userCount }} 人</span>
          </div>
        </div>
        <div class="modal-buttons">
          <el-button type="primary" @click="handleGuideClick">网站导览</el-button>
          <el-button @click="handleCloseClick" v-if="!isFirstLoad">关闭</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '网站信息'
  },
  stats: {
    type: Object,
    default: () => ({
      clickCount: 0,
      userCount: 0
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close', 'guide'])

// 检查是否为第一次加载
const isFirstLoad = ref(true)

// 计算 loading 状态
const isStatsLoading = computed(() => {
  return props.loading || (props.stats.clickCount === 0 && props.stats.userCount === 0)
})

// 检查localStorage中的用户状态
onMounted(() => {
  const hasVisited = localStorage.getItem('hasVisited')
  if (hasVisited) {
    isFirstLoad.value = false
  }
})

// 处理查看引导点击
const handleGuideClick = () => {
  // 标记用户已访问过
  localStorage.setItem('hasVisited', 'true')
  isFirstLoad.value = false
  
  // 触发引导事件
  emit('guide')
}

// 处理关闭按钮点击
const handleCloseClick = () => {
  emit('close')
}

// 处理弹窗外部点击
const handleOverlayClick = () => {
  if (isFirstLoad.value) {
    // 第一次加载时，视为点击查看引导
    handleGuideClick()
  } else {
    // 非第一次加载时，正常关闭弹窗
    emit('close')
  }
}

</script>

<style scoped>
.user-img {
  position: absolute;
  top: -135px;
  right: -25%;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.modal-overlay.show {
  opacity: 1;
  visibility: visible;
}

/* PC端显示，移动端隐藏 */
.show-in-pc {
  display: inline-flex;
}

/* 移动端显示，PC端隐藏 */
.show-in-media {
  display: none;
}

.modal-content {
  position: relative;
  background: url('/assets/backgrounds/popupBg-big.png') no-repeat;
  background-size: contain;
  background-position: center top;
  border-radius: 15px;
  max-width: 500px;
  width: 90%;
  overflow: visible;
  transition: all 0.3s ease;
}

.close-btn {
  cursor: pointer;
  position: absolute;
  bottom: -50px;
  width: 40px;
  height: 40px;
  left: 50%;
  transform: translateX(-50%);
}

.modal-info {
  background: #ffffff;
  margin-top: 25%;
  border-radius: 10%;
  padding: 32px 40px 30px 40px;
}


.modal-title {
  color: #1a75ff;
  font-size: 1.5em;
  font-weight: bold;
}

.modal-text {
  line-height: 1.5;
  font-size: 16px;
  color: #333;
}

.modal-stats {
  display: flex;
  gap: 50px;
  justify-content: center;
  margin-top: 8%;
}

.stat-row {
  display: flex;
  flex-direction: column;
  padding: 12px 45px;
  background: #F8F8F8;
  border-radius: 37px;
  align-items: center;
}

.stat-label {
  color: #627982;
}

.stat-value {
  color: #1C2B31;
  font-weight: bold;
}

.modal-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 8%;
}


@media (max-width: 768px) {
  .user-img {
    position: absolute;
    top: -11%;
    right: -15%;
    height: 117px;
  }

  .modal-content {
    background: url('/assets/backgrounds/popupBg-big.png') no-repeat;
    background-size: contain;
  }

  /* PC端显示，移动端隐藏 */
  .show-in-pc {
    display: none;
  }

  /* 移动端，PC端隐藏 */
  .show-in-media {
    display: inline-flex;

  }

  .modal-content {
    border-radius: 15px;
    width: 322px;
  }

  .modal-info {
    margin-top: 78px;
    border-radius: 28px;
    padding: 17px 17px 28px 19px;
  }

  .modal-stats {
    gap: 13px;
  }

  .stat-row {
    padding: 3px 40px;
    border-radius: 17px;
  }

  .modal-buttons {
    gap: 10px;
    margin-top: 15px;
  }

    .modal-text {
      line-height: 1.5;
      font-size: 13px;
      color: #333;
    }
  
    .stat-label {
      color: #627982;
      font-size: 12px;
    }
  
    .stat-value {
      color: #1C2B31;
      font-weight: bold;
      font-size: 12px;
    }

  .close-btn {
    cursor: pointer;
    position: absolute;
    bottom: -50px;
    width: 28px;
    height: 28px;
    left: 50%;
    transform: translateX(-50%);
  }
}

@media (max-width: 480px) {
  .user-img {
    position: absolute;
    top: -11%;
    right: -15%;
    height: 117px;
  }

  .modal-content {
    background: url('/assets/backgrounds/popupBg-big.png') no-repeat;
    background-size: contain;
  }

  /* PC端显示，移动端隐藏 */
  .show-in-pc {
    display: none;
  }

  /* 移动端，PC端隐藏 */
  .show-in-media {
    display: inline-flex;

  }

  .modal-content {
    border-radius: 15px;
    width: 322px;
    box-sizing: border-box;
  }

  .modal-info {
    margin-top: 78px;
    border-radius: 28px;
    padding: 17px 17px 28px 19px;
  }

  .modal-stats {
    gap: 13px;
  }

  .stat-row {
    padding: 3px 40px;
    border-radius: 17px;
  }

  .modal-buttons {
    gap: 10px;
    margin-top: 15px;
  }

  .modal-text {
    line-height: 1.5;
    font-size: 13px;
    color: #333;
  }

  .stat-label {
    color: #627982;
    font-size: 12px;
  }

  .stat-value {
    color: #1C2B31;
    font-weight: bold;
    font-size: 12px;
  }
}
</style>