<template>
  <div class="comment-section">
    <div class="comment-input-area">
      <input 
        :value="newComment" 
        @input="$emit('update:newComment', $event.target.value)"
        placeholder="输入你的留言..." 
        class="comment-input"
        @keyup.enter="$emit('submitComment')"
      >
      <button @click="$emit('submitComment')" class="submit-btn">提交</button>
    </div>
    
    <div class="comments-list">
      <div v-for="(msg, index) in comments" :key="msg.id" class="comment-item">
        <span class="comment-time">{{ msg.time }}</span>
        <span class="comment-content">{{ msg.content }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
defineProps({
  newComment: {
    type: String,
    required: true
  },
  comments: {
    type: Array,
    required: true
  }
})

// Emits
defineEmits(['submitComment', 'update:newComment'])
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

.comments-list {
  max-height: 300px;
  overflow-y: auto;
}

.comment-item {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.comment-time {
  color: #666;
  font-size: 12px;
  white-space: nowrap;
  min-width: 80px;
}

.comment-content {
  flex: 1;
  word-break: break-all;
}
</style> 