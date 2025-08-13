<template>
  <div class="modal-overlay" :class="{ show: visible }" @click="$emit('close')">
    <div class="modal-content" :class="modalClass" @click.stop>
      <button class="close-btn" @click="$emit('close')">×</button>
      <h2 class="modal-title">{{ title }}</h2>
      
      <!-- 网站信息内容 -->
      <div v-if="type === 'info'">
        <p class="modal-text">
          欢迎来到原神天堂内鬼吧二周年共创纪念网站！
        </p>
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
            <span class="stat-label">访问量：</span>
            <span class="stat-value">{{ stats.clickCount }} 次</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">用户量：</span>
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
              <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="captcha-input-area">
          <input 
            :value="captchaInput" 
            @input="handleCaptchaInput"
            placeholder="请输入6位数字验证码" 
            class="captcha-input"
            @keyup.enter="$emit('submitCaptcha')"
            maxlength="6"
            ref="captchaInput"
          >
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

.modal-content {
  background: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  transform: scale(0.8);
  transition: all 0.3s ease;
}

.modal-overlay.show .modal-content {
  transform: scale(1);
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: #333;
}

.modal-title {
  margin: 0 0 20px 0;
  color: #1a75ff;
  font-size: 1.5em;
  font-weight: bold;
}

.modal-text {
  margin: 0 0 15px 0;
  line-height: 1.6;
  color: #333;
}

.modal-stats {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-weight: bold;
  color: #666;
}

.stat-value {
  color: #1a75ff;
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
</style> 