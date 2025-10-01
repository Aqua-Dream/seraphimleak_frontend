<template>
    <el-dialog
      v-model="dialogVisible"
      :title="title"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      @close="$emit('close')"
      center
    >
      <!-- 验证码内容 -->
      <div class="captcha-container">
        <div class="captcha-image-container" v-loading="isRefreshing" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.8)">
          <img :src="captchaImage" alt="验证码" class="captcha-image" v-if="captchaImage">
          <el-button 
            @click="$emit('refreshCaptcha')" 
            :loading="isRefreshing || isSubmitting"
            :icon="Refresh"
            circle
            size="small"
            title="刷新验证码"
          />
        </div>
        <div class="captcha-input-area">
          <el-input 
            v-model="captchaInputValue"
            placeholder="请输入6位数字验证码" 
            maxlength="6"
            @input="handleCaptchaInput"
            @keyup.enter="$emit('submitCaptcha')"
            ref="captchaInput"
            clearable
            :formatter="(value) => value.replace(/\D/g, '')"
            :parser="(value) => value.replace(/\D/g, '')"
          />
          <el-button 
            @click="$emit('submitCaptcha')" 
            type="primary"
            :loading="isRefreshing || isSubmitting"
            :disabled="!captchaInputValue || captchaInputValue.length !== 6"
          >
            提交
          </el-button>
        </div>
      </div>
    </el-dialog>
  </template>
  
<script setup>
import { computed, ref, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '请输入验证码'
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
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  isRefreshing: {
    type: Boolean,
    default: false
  }
})
  
// Emits
const emit = defineEmits(['close', 'refreshCaptcha', 'submitCaptcha', 'validateCaptchaInput', 'update:captchaInput'])

// 响应式数据
const captchaInputValue = ref(props.captchaInput)

// 监听 props.captchaInput 变化
watch(() => props.captchaInput, (newValue) => {
  captchaInputValue.value = newValue
})

// 监听 captchaInputValue 变化
watch(captchaInputValue, (newValue) => {
  emit('update:captchaInput', newValue)
  emit('validateCaptchaInput')
})

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => {
    if (!value) {
      emit('close')
    }
  }
})

// 方法
const handleCaptchaInput = (value) => {
  captchaInputValue.value = value
  emit('update:captchaInput', value)
  emit('validateCaptchaInput')
}
</script> 
  
<style scoped>
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
  min-height: 60px;
  position: relative;
}

.captcha-image {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
  background: #f8f9fa;
  max-width: 200px;
  height: auto;
}

.captcha-input-area {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-input-area .el-input {
  flex: 1;
}
</style> 