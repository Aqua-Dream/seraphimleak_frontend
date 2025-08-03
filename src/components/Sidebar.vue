<template>
  <aside class="sidebar">
    <ul>
      <li v-for="item in tiebaList" :key="item.id" @click="$emit('switchTieba', item)">
        <img :src="item.avatar" :alt="item.name" class="avatar-small">
      </li>
    </ul>
  </aside>
</template>

<script setup>
// Props
defineProps({
  tiebaList: {
    type: Array,
    required: true
  }
})

// Emits
defineEmits(['switchTieba'])
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 30px;
  top: 120px;
  width: 120px;
  z-index: 100;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar li {
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sidebar li:hover {
  transform: scale(1.1);
}

.avatar-small {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 4px 15px rgba(26, 117, 255, 0.3);
}

@media (max-width: 768px) {
  .sidebar {
    position: static;
    transform: none;
    margin-top: 20px;
  }
  
  .sidebar ul {
    display: flex;
    justify-content: center;
    gap: 10px;
  }
  
  .sidebar li {
    margin-bottom: 0;
  }
}
</style> 