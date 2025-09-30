<template>
  <div class="comment-area">
    <div class="comment-section">
      <div class="comment-input-area">
        <el-input 
          size="large"
          :model-value="newComment" 
          @update:model-value="$emit('update:newComment', $event)"
          placeholder="输入你的留言..."
          :minlength="1"
          :maxlength="100"
          :show-word-limit="true"
          @keyup.enter="handleSubmitComment">
          <template #append> <el-button @click="handleSubmitComment">提交</el-button> </template>
          <template #prefix>
            <el-select
              v-model="selectedColor"
              suffix-icon=""
              :style="{
                width: '28px',
                height: '28px',
                backgroundColor: selectedColor?.value || '#FFFFFF',
                border: selectedColor?.value === '#FFFFFF' ? '1px solid #ccc' : 'none',
                borderRadius: '6px'
              }"
            >
              <el-option
                v-for="item in namedColorsList"
                :key="item.value"
                :value="item"
                :label="item.label"
              >
                <div class="flex items-center">
                  <el-tag :color="item.value"  :style="{
                    marginRight: '8px',
                    border: item.value === '#FFFFFF' ? '1px solid #ccc' : 'none'
                  }" size="small" />
                  <span>{{ item.label }}</span>
                </div>
              </el-option>
            </el-select>
          </template>
        </el-input>
      </div>
      <div class="comments-container">
        <div class="comments-list">
          <div v-if="comments.length === 0" class="empty-state">
            <div class="empty-icon">💬</div>
            <div class="empty-text">还没有评论，快来发表第一条评论吧！</div>
          </div>

          <div v-else v-for="(msg, index) in paginatedComments" :key="msg.id" class="comment-item">
            <div class="comment-body">
              <span class="comment-content">{{ msg.content }}</span>
            </div>
            <div class="comment-footer" :title="getFullFormattedTime(msg)" :style="{ backgroundColor: getFloorBackgroundColor(msg.id) }">
              第{{ msg.id }}楼 {{ getFormattedTime(msg) }}
            </div>
          </div>
        </div>

        <div class="pagination">
          <span class="page-info">
            <span>{{ comments.length }}</span> 回复贴，共 <span>{{ totalPages }}</span> 页
          </span>
          
          <el-pagination
            v-model:current-page="currentPage"
            :total="comments.length"
            :page-size="pageSize"
            :background="true"
            layout="prev, pager, next"
            :size="isMobile ? 'small' : 'default'"
            class="pagination-component"
          />
        </div>
      </div>
      <Captcha :visible="showCaptcha" title="验证码验证" :captcha-image="captchaImage"
        :captcha-input="captchaInput" :is-valid-captcha="isValidCaptcha" @close="closeCaptcha"
        @refresh-captcha="refreshCaptcha" @submit-captcha="submitCaptcha" @validate-captcha-input="validateCaptchaInput"
        @update:captcha-input="captchaInput = $event" />
    </div>
    <div class="line-top"></div>
    <div class="line-bottom"></div>
  </div>

</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { formatDateTime, formatFullDateTime } from '../utils/dateFormatter.js'
import { namedColorsList } from '../utils/colors.js'
import Captcha from './Captcha.vue'

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

// 响应式检测
const isMobile = ref(false)

// 检测屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768
}

// 弹幕颜色相关 - 从共享配置导入

const selectedColor = ref({ label: '白色弹幕', value: '#FFFFFF' });




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

// 获取楼层背景颜色的函数
const getFloorBackgroundColor = (floorNumber) => {
  const colors = ['#64D2FF', '#48E4E4', '#6D84F7', '#2877E6', '#FF648B', '#FF8364']
  const index = (floorNumber - 1) % colors.length
  return colors[index]
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
    console.log(selectedColor.value);
    const result = await props.apiAdapter.submitComment(commentText, selectedColor.value.value, captchaInput, captchaIdToSend);

    if (result.success) {
      // 添加新评论到列表
      const newComment = {
        id: result.id,
        content: result.content,
        color: result.color,
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
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

// 组件卸载时停止时间刷新
onUnmounted(() => {
  stopTimeRefresh()
  window.removeEventListener('resize', checkScreenSize)
})

// 暴露方法给父组件
defineExpose({
  handleSubmitComment
})
</script>

<style scoped>
.line-top {
  position: absolute;
  /* 相对于 comment-area 定位 */
  top: -85px;
  left: -120px;
  /* 左边对齐 */
  width: 300px;
  /* 根据你的 line.png 宽度调整 */
  height: 300px;
  /* 根据你的 line.png 高度调整 */
  background: url('/assets/backgrounds/line.png') no-repeat left top;
  background-size: cover;
  z-index: -1;
  /* 或 contain，根据效果 */
}

.line-bottom {
  position: absolute;
  /* 相对于 comment-area 定位 */
  bottom: 135px;
  /* 顶部对齐 */
  right: -80px;
  /* 左边对齐 */
  width: 300px;
  /* 根据你的 line.png 宽度调整 */
  height: 300px;
  /* 根据你的 line.png 高度调整 */
  background: url('/assets/backgrounds/line2.png') no-repeat;
  background-size: cover;
  z-index: -1;
  /* 或 contain，根据效果 */
}

.comment-area {
  position: relative;
  margin-top: 2vw;
}

.comment-section {
  position: relative;
}

.comment-input-area {
  display: flex;
  margin-bottom: 10px;
}

::v-deep(.el-input) {
  --el-input-border-color: #64D2FF;
  --el-input-border-radius: 16px;
  --el-input-hover-border-color: #64D2FF;
  --el-input-focus-border-color: #64D2FF;
}

::v-deep(.el-input-group__append) {
  background-color: #30B5EE;
  color: #FFFFFF;
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
  border-radius: 16px;
  box-shadow: var(--el-box-shadow);
}

.comments-list {
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 1300px;
  overflow-y: auto;
  border-radius: 20px;
  padding: 45px 42px;
  gap: 30px;
}

.comment-item {
  position: relative;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  border-radius: 8px;
  background: #fff;
  display: flex;
  padding: 0 25px;
  align-items: center;
}

.comment-item:hover {
  background: #f5f5f5;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comment-body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 40px 0 30px 0;
}

.comment-footer {
  position: absolute;
  display: flex;
  top: -11px;
  left: 0;
  /* 使用 Flexbox 布局 */
  justify-content: flex-end;
  /* 将内容靠右对齐 */
  align-items: center;
  /* 垂直居中对齐（可选） */
  color: #FFFFFF;
  font-size: 16px;
  padding: 4px 14px;
  border-radius: 0px 8px 8px 0px;
}


.comment-content {
  color: #333;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
  display: block;
  margin-bottom: 0;
  white-space: pre-wrap;
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
  margin: 15px 25px;
  flex-wrap: wrap;
  row-gap: 10px;
}

.page-info {
  color: #637085;
}

.pagination-component {
  margin-left: 15px;
}

@media (max-width: 768px) {
  .comment-section .pagination {
    flex-direction: column !important;
    gap: 15px !important;
  }

  .comment-input-area {
    margin-bottom: 11px;
  }

  .comments-list {
    border-radius: 8px;
    padding: 16px 12px;
    gap: 16px;
  }

  .comment-item {
    border-radius: 6px;
    min-height: 58px;
    padding: 0 10px;
    align-items: center;
  }

  .comment-content {
    font-size: 13px;
    white-space: pre-wrap;
    text-overflow: ellipsis;
  }

  .comment-body {
    margin: 16px 0 8px 0;
  }

  .comment-footer {
    top: -7px;
    left: 0;
    font-size: 10px;
    padding: 2px 5px;
    border-radius: 0px 2px 2px 0px;
  }

  .line-top {
    top: -36px;
    left: -22px;
    width: 140px;
    height: 198px;
    background: url('/assets/backgrounds/line-small.png') no-repeat left top;
  }

  .line-bottom {
    bottom: 116px;
    right: -46px;
    width: 180px;
    height: 180px;
    background: url('/assets/backgrounds/line2-small.png') no-repeat center top;
  }

  ::v-deep(.el-input) {
    --el-input-inner-height: 40px;
    font-size: small;
  }

  ::v-deep(.el-input-group__append) {
    padding: 0 14px;
  }

  .comment-section .page-info {
    margin-left: 0 !important;
    text-align: center !important;
    width: 100% !important;
  }

  .pagination-component {
    margin-left: 0 !important;
  }

  .page-info {
    font-size: 13px;
  }
}


.el-tag {
  border: none;
  aspect-ratio: 1;
}

/* 颜色选择器样式 */
::v-deep(.el-select__wrapper) {
  background-color: transparent !important;
  box-shadow: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

::v-deep(.el-select__selected-item) {
  display: none !important;
}

::v-deep(.el-select__placeholder) {
  display: none !important;
}

::v-deep(.el-select__suffix) {
  display: none !important;
}
</style>