<template>
  <div class="modal-overlay" :class="{ show: visible }" @click="$emit('close')">
    <div class="modal-content" :class="modalClass" @click.stop>
      <img src="/assets/backgrounds/popupIcon-big.png" class="user-img show-in-pc" alt="">
      <img src="/assets/backgrounds/popupIcon-big.png" class="user-img show-in-media" alt="">
      <img src="/assets/backgrounds/close-button.png" @click="$emit('close')" class="close-btn" alt="">
      <!-- 网站信息内容 -->
      <div class="modal-info" v-if="type === 'info'">
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
        <div class="modal-stats">
          <div class="stat-row">
            <span class="stat-label">访问量(次)</span>
            <span class="stat-value">{{ stats.clickCount }} 次</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">用户量(人)</span>
            <span class="stat-value">{{ stats.userCount }} 人</span>
          </div>
        </div>
      </div>
      <!-- 验证码内容 -->
      <div v-else-if="type === 'captcha'" class="captcha-container">
        <div class="captcha-image-container">
          <img :src="captchaImage" alt="验证码" class="captcha-image" v-if="captchaImage">
          <button @click="$emit('refreshCaptcha')" class="captcha-refresh-btn" title="刷新验证码">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
        <div class="captcha-input-area">
          <input :value="captchaInput" @input="handleCaptchaInput" placeholder="请输入6位数字验证码" class="captcha-input"
            @keyup.enter="$emit('submitCaptcha')" maxlength="6" ref="captchaInput">
          <button @click="$emit('submitCaptcha')" class="captcha-submit-btn" :disabled="!isValidCaptcha">提交</button>
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
  type: {
    type: String,
    default: 'info', // 'info' | 'captcha'
    validator: (value) => ['info', 'captcha'].includes(value)
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
  captchaImage: {
    type: String,
    default: ''
  },
  captchaInput: {
    type: String,
    default: ''
  },
  isValidCaptcha: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close', 'refreshCaptcha', 'submitCaptcha', 'validateCaptchaInput', 'update:captchaInput'])

// 方法
const handleCaptchaInput = (event) => {
  emit('update:captchaInput', event.target.value)
  emit('validateCaptchaInput')
}

// 计算属性
const modalClass = computed(() => {
  return props.type === 'captcha' ? 'captcha-modal' : ''
})
</script>

<style scoped>
.user-img {
  position: absolute;
  top: -73px;
  right: -73px;
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
  border-radius: 15px;
  max-width: 700px;
  width: 100%;
  overflow: visible;
  transition: all 0.3s ease;
}

.close-btn {
  cursor: pointer;
  position: absolute;
  bottom: -80px;
  width: 50px;
  height: 50px;
  left: 50%;
  transform: translateX(-50%);
}

.modal-info {
  background: #ffffff;
  margin-top: 160px;
  border-radius: 60px;
  padding: 32px 40px 57px 40px;
}

.modal-overlay.show .modal-content {
  /* transform: scale(1); */
}

.modal-title {
  color: #1a75ff;
  font-size: 1.5em;
  font-weight: bold;
}

.modal-text {
  line-height: 1.5;
  font-size: 20px;
  color: #333;
}

.modal-stats {
  display: flex;
  gap: 30px;
}

.stat-row {
  display: flex;
  flex-direction: column;
  padding: 12px 105px;
  background: #F8F8F8;
  line-height: 1.6;
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

.captcha-modal {
  max-width: 400px;
}

.captcha-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.captcha-image-container {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.captcha-image {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
  background: #f8f9fa;
  max-width: 200px;
  height: auto;
}

.captcha-refresh-btn {
  background: #1a75ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-refresh-btn:hover {
  background: #4da6ff;
  transform: scale(1.1);
}

.captcha-refresh-btn svg {
  width: 16px;
  height: 16px;
}

.captcha-input-area {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-input {
  flex: 1;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  outline: none;
}

.captcha-input:focus {
  border-color: #1a75ff;
  box-shadow: 0 0 0 3px rgba(26, 117, 255, 0.1);
}

.captcha-submit-btn {
  padding: 10px 20px;
  background: #1a75ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.captcha-submit-btn:hover {
  background: #4da6ff;
  transform: translateY(-2px);
}

.captcha-submit-btn:active {
  transform: translateY(0);
}

.captcha-submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.captcha-submit-btn:disabled:hover {
  background: #ccc;
  transform: none;
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