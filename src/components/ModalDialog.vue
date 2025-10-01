<template>
  <div class="modal-overlay" :class="{ show: visible }" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <img src="/assets/backgrounds/popupIcon-big.png" class="user-img show-in-pc" alt="">
      <img src="/assets/backgrounds/popupIcon-big.png" class="user-img show-in-media" alt="">
      <img src="/assets/backgrounds/close-button.png" @click="$emit('close')" class="close-btn" alt="">
      <!-- 网站信息内容 -->
      <div class="modal-info">
        <p class="modal-text">
          本网站为粉丝纪念网站，所有内容仅供交流学习使用，不涉及任何商业行为。
          所有图片、音乐等素材版权归原作者所有，如有侵权请联系我们删除。
        </p>
        <p class="modal-text">
          请各位玩家理性讨论，遵守相关法律法规，共同维护良好的网络环境。
        </p>
        <p class="modal-text">
          祝愿原神越做越好，玩家们游戏愉快！
        </p>
        <div class="modal-stats" v-loading="isStatsLoading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.8)">
          <div class="stat-row">
            <span class="stat-label">访问量</span>
            <span class="stat-value">{{ stats.clickCount }} 次</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">用户量</span>
            <span class="stat-value">{{ stats.userCount }} 人</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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
const emit = defineEmits(['close'])

// 计算 loading 状态
const isStatsLoading = computed(() => {
  return props.loading || (props.stats.clickCount === 0 && props.stats.userCount === 0)
})

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
  padding: 32px 40px 57px 40px;
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