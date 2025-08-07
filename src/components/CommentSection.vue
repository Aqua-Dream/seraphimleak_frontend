<template>
  <div class="comment-section">
    <div class="comment-input-area">
      <input :value="newComment" @input="$emit('update:newComment', $event.target.value)" placeholder="输入你的留言..."
        class="comment-input" @keyup.enter="handleSubmitComment">
      <button @click="handleSubmitComment" class="submit-btn">
        提交
      </button>
    </div>

    <div class="comments-container">
      <div class="comments-list">
        <!-- 空状态 -->
        <div v-if="comments.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-text">还没有评论，快来发表第一条评论吧！</div>
        </div>

        <!-- 评论列表 -->
        <div v-else v-for="(msg, index) in paginatedComments" :key="msg.id" class="comment-item">
          <div class="comment-body">
            <span class="comment-content">{{ msg.content }}</span>
          </div>
          <div class="comment-footer" :title="getFullFormattedTime(msg)">
            第{{ msg.id }}楼 {{ getFormattedTime(msg) }}
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="pagination">
        <!-- 首页按钮 -->
        <button v-if="currentPage > 1" @click="currentPage = 1" class="page-btn">
          首页
        </button>

        <!-- 上一页按钮 -->
        <button v-if="currentPage > 1" @click="currentPage--" class="page-btn">
          上一页
        </button>

        <!-- 页码按钮 -->
        <div class="page-numbers">
          <button v-for="page in visiblePages" :key="page" @click="currentPage = page"
            :class="['page-btn', { 'active': currentPage === page }]">
            {{ page }}
          </button>
        </div>

        <!-- 下一页按钮 -->
        <button v-if="currentPage < totalPages" @click="currentPage++" class="page-btn">
          下一页
        </button>

        <!-- 尾页按钮 -->
        <button v-if="currentPage < totalPages" @click="currentPage = totalPages" class="page-btn">
          尾页
        </button>

        <!-- 分页信息 -->
        <span class="page-info">
          <span>{{ comments.length }}</span> 回复贴，共<span>{{ totalPages }}</span>页
        </span>

        <!-- 跳转控件 -->
        <div class="jump-to-page">
          <span>跳到</span>
          <input v-model="jumpPage" type="number" min="1" :max="totalPages" class="jump-input"
            @keyup.enter="jumpToPage">
          <span>页</span>
          <button @click="jumpToPage" class="jump-btn">确定</button>
        </div>
      </div>
    </div>

    <!-- 验证码对话框 -->
    <ModalDialog :visible="showCaptcha" type="captcha" title="验证码验证" :captcha-image="captchaImage"
      :captcha-input="captchaInput" :is-valid-captcha="isValidCaptcha" @close="closeCaptcha"
      @refresh-captcha="refreshCaptcha" @submit-captcha="submitCaptcha" @validate-captcha-input="validateCaptchaInput"
      @update:captcha-input="captchaInput = $event" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { formatDateTime, formatFullDateTime } from '../utils/dateFormatter.js'
import ModalDialog from './ModalDialog.vue'

// Props
const props = defineProps({
  newComment: {
    type: String,
    required: true
  },
  comments: {
    type: Array,
    required: true
  },
  apiAdapter: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits([
  'update:newComment',
  'new-comment'
])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const jumpPage = ref('')



// 验证码相关
const captchaId = ref(null)
const showCaptcha = ref(false)
const captchaImage = ref('')
const captchaInput = ref('')

// 时间刷新相关
const timeRefreshTrigger = ref(0)
let timeRefreshTimer = null

// 计算验证码是否有效
const isValidCaptcha = computed(() => {
  return /^\d{6}$/.test(captchaInput.value)
})

// 格式化时间的函数
const getFormattedTime = (msg) => {
  // 使用 timeRefreshTrigger 来触发响应式更新
  timeRefreshTrigger.value
  
  // 直接使用 created_at 字段作为原始时间进行实时计算
  return formatDateTime(msg.created_at)
}

// 获取完整时间的函数
const getFullFormattedTime = (msg) => {
  // 使用 timeRefreshTrigger 来触发响应式更新
  timeRefreshTrigger.value
  
  // 直接使用 created_at 字段作为原始时间进行实时计算
  return formatFullDateTime(msg.created_at)
}

// 启动时间刷新定时器
const startTimeRefresh = () => {
  // 清除可能存在的旧定时器
  if (timeRefreshTimer) {
    clearInterval(timeRefreshTimer)
  }
  
  // 每分钟更新一次时间
  timeRefreshTimer = setInterval(() => {
    timeRefreshTrigger.value++
  }, 60000) // 60000ms = 1分钟
}

// 停止时间刷新定时器
const stopTimeRefresh = () => {
  if (timeRefreshTimer) {
    clearInterval(timeRefreshTimer)
    timeRefreshTimer = null
  }
}

// 计算总页数
const totalPages = computed(() => Math.ceil(props.comments.length / pageSize.value))

// 计算当前页的评论
const paginatedComments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.comments.slice(start, end)
})

// 计算可见的页码
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// 提交评论的核心逻辑
const submitCommentCore = async (commentText, captchaInput = null) => {
  if (!commentText.trim()) {
    alert('请输入留言内容');
    return;
  }

  if (commentText.length > 100) {
    alert('留言不能超过100字');
    return;
  }

  // 验证码格式验证（仅在提供验证码时）
  if (captchaInput !== null && !validateCaptchaFormat(captchaInput)) {
    alert('验证码必须是6位数字');
    return;
  }

  try {
    // 如果提供了验证码输入，同时传递验证码ID
    const captchaIdToSend = captchaInput !== null ? captchaId.value : null;
    const result = await props.apiAdapter.submitComment(commentText, captchaInput, captchaIdToSend);

    if (result.success) {
      // 添加新评论到列表
      const newComment = {
        id: result.id,
        content: result.content,
        created_at: result.created_at || new Date().toLocaleString('zh-CN')
      };

      // 通知父组件更新评论列表
      emit('new-comment', newComment);

      // 清空输入框
      emit('update:newComment', '');

      // 如果是验证码提交，关闭验证码对话框
      if (captchaInput !== null) {
        closeCaptcha();
      }

      // 显示成功消息
      console.log('评论提交成功');
      
      // 自动跳转到最后一页，让用户看到自己刚发表的评论
      if (totalPages.value > 0) {
        currentPage.value = totalPages.value;
        // 等待DOM更新后滚动到底部
        setTimeout(() => {
          scrollToBottom();
        }, 300);
      }
    } else {
      // 处理需要验证码的情况
      if (result.captchaError) {
        // 获得了验证码
        if (result.captchaData) {
          if (showCaptcha.value) {
            // 验证码对话框已经展示
            alert('验证码错误或已过期，请重新输入或刷新验证码');
          } else {
            // 展示验证码对话框
            showCaptchaDialog(result);
          }
        } else { //没能获得验证码，被限流了
          alert('请求过于频繁，请稍后再试');
        }
      } else {
        alert(result.error || '提交失败，请重试');
      }
    }
  } catch (error) {
    console.error('提交评论失败:', error);

    // 处理限流错误
    if (error.status === 429) {
      const retryAfter = error.retry_after || 60;
      alert(`请求过于频繁，请${retryAfter}秒后再试`);
    } else {
      alert('提交失败，请重试');
    }
  }
}

// 提交评论
const handleSubmitComment = async () => {
  await submitCommentCore(props.newComment);
}

// 显示验证码对话框
const showCaptchaDialog = (result) => {
  if (result.captchaData) {
    captchaImage.value = result.captchaData.image;
    captchaId.value = result.captchaData.captcha_id;
  }
  captchaInput.value = '';
  showCaptcha.value = true;
}

// 刷新验证码
const refreshCaptcha = async () => {
  try {
    const result = await props.apiAdapter.getCaptcha();
    if (result.success) {
      captchaImage.value = result.data.image;
      captchaId.value = result.data.captcha_id;
      captchaInput.value = '';
    } else if (result.error) {
      alert(result.error);
    } else {
      alert('刷新验证码失败，请重试');
    }
  } catch (error) {
    console.error('刷新验证码失败:', error);
    alert('刷新验证码失败，请重试');
  }
}

// 关闭验证码对话框
const closeCaptcha = () => {
  showCaptcha.value = false;
  captchaImage.value = '';
  captchaInput.value = '';
  captchaId.value = null;
}

// 验证验证码格式
const validateCaptchaFormat = (captcha) => {
  return /^\d{6}$/.test(captcha);
}

// 验证验证码输入
const validateCaptchaInput = () => {
  // 只允许输入数字
  captchaInput.value = captchaInput.value.replace(/[^\d]/g, '');
}

// 提交验证码
const submitCaptcha = async () => {
  if (!captchaInput.value.trim()) {
    return;
  }

  // 确保有验证码ID
  if (!captchaId.value) {
    alert('验证码ID无效，请刷新验证码');
    return;
  }

  await submitCommentCore(props.newComment, captchaInput.value);
}

// 跳转到指定页
const jumpToPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    jumpPage.value = ''
  }
}

// 滚动到页面底部
const scrollToBottom = () => {
  // 滚动到页面底部
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  })
}







// 组件挂载时启动时间刷新
onMounted(() => {
  startTimeRefresh()
})

// 组件卸载时停止时间刷新
onUnmounted(() => {
  stopTimeRefresh()
})

// 暴露方法给父组件
defineExpose({
  handleSubmitComment
})
</script>

<style scoped>
.comment-section {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.comment-input-area {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.comment-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  outline: none;
}

.comment-input:focus {
  border-color: #1a75ff;
  box-shadow: 0 0 0 3px rgba(26, 117, 255, 0.1);
}

.submit-btn {
  padding: 12px 24px;
  background: #1a75ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background: #4da6ff;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
}

.submit-btn:disabled:hover {
  background: #cccccc;
  transform: none;
}

.comments-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comments-list {
  max-height: 1200px;
  overflow-y: auto;
}

.comment-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  border-radius: 12px;
  margin-bottom: 6px;
  background: #fafafa;
  min-height: 50px;
}

.comment-item:hover {
  background: #f5f5f5;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comment-body {
  margin-bottom: 10px;
}

.comment-footer {
  display: flex;
  /* 使用 Flexbox 布局 */
  justify-content: flex-end;
  /* 将内容靠右对齐 */
  align-items: center;
  /* 垂直居中对齐（可选） */
  padding-top: 6px;
  margin-top: 8px;
  color: #b4b4b4;
  font-size: 12px;
}


.comment-content {
  color: #333;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
  display: block;
  margin-bottom: 0;
  max-height: 40px;
  overflow: hidden;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #888;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 15px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 8px;
  flex-wrap: wrap;
  row-gap: 10px;
}

@media (max-width: 768px) {
  .pagination {
    flex-direction: column;
    gap: 10px;
  }

  .page-info {
    margin-left: 0;
    order: -1;
  }

  .jump-to-page {
    margin-left: 0;
  }
}

.page-btn {
  padding: 6px 12px;
  background: white;
  color: #1a75ff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  min-width: 40px;
}

.page-btn:hover {
  background: #f0f8ff;
  border-color: #1a75ff;
}

.page-btn.active {
  background: #1a75ff;
  color: white;
  border-color: #1a75ff;
  font-weight: bold;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-info {
  font-size: 14px;
  color: #333;
  margin-left: 15px;
}

.page-info span {
  color: #ff6b35;
  font-weight: bold;
}

.jump-to-page {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 15px;
}

.jump-input {
  width: 50px;
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.jump-btn {
  padding: 4px 8px;
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.jump-btn:hover {
  background: #f0f0f0;
}
</style>