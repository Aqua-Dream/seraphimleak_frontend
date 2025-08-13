<template>
  <div class="footer-info">
    <div class="footer-container">
      <div class="footer-row">
        <span class="author-text">Made by @风靡义磊</span>
      </div>
      <div class="footer-row">
        <span class="author-text">Sponsored by @费德里科~吉亚洛</span>
      </div>
      <div class="footer-row">
        <a href="https://beian.miit.gov.cn/" target="_blank" class="beian-link">鲁ICP备2025179278号-1</a>
      </div>
    </div>
  </div>
</template>


<style scoped>
.footer-info {
  text-align: center;
  margin-top: 30px;
  padding: 20px;
}

.footer-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  justify-content: center;
}

.stat-text {
  color: #666;
  font-size: 14px;
}

.beian-text {
  color: #999;
  font-size: 12px;
}

.footer-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.author-text {
  color: #666;
  font-size: 14px;
}

.beian-link {
  color: #999;
  text-decoration: none;
  font-size: 12px;
  transition: all 0.3s ease;
}

.beian-link:hover {
  color: #1a75ff;
}

@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 