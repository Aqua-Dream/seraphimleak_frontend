// API适配器 - 根据环境自动选择数据源
class ApiAdapter {
  constructor() {
    // 检测是否为本地开发环境
    this.isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  // 获取统计数据
  async getStats() {
    if (this.isLocalDev) {
      // 本地环境：从JSON文件获取
      const response = await fetch('/data/stats.json');
      return await response.json();
    } else {
      // 测试和正式环境：从后端API获取
      const response = await fetch(`/api/stats`);
      return await response.json();
    }
  }

  // 获取评论数据
  async getComments(limit = 50, offset = 0) {
    if (this.isLocalDev) {
      // 本地开发：从JSON文件获取
      const response = await fetch('/data/comments.json');
      const data = await response.json();
      
      // 模拟分页
      const start = offset;
      const end = start + limit;
      return {
        comments: data.comments.slice(start, end)
      };
    } else {
      // 生产环境：从后端API获取
      const params = new URLSearchParams({ limit, offset });
      const response = await fetch(`/api/comments?${params}`);
      return await response.json();
    }
  }

  // 提交评论
  async submitComment(content, captcha = null) {
    // 字数限制验证
    if (content.length > 100) {
      return {
        success: false,
        error: '留言不能超过100字'
      };
    }
    
    if (!content.trim()) {
      return {
        success: false,
        error: '留言内容不能为空'
      };
    }

    if (this.isLocalDev) {
      // 本地开发：模拟提交
      const newComment = {
        id: Date.now(), // 使用时间戳作为临时ID
        content: content,
        time: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      
      // 模拟成功响应
      return {
        success: true,
        id: newComment.id,
        content: newComment.content,
        time: newComment.time
      };
    } else {
      // 生产环境：提交到后端API
      const requestBody = { content };
      
      // 如果需要验证码，添加验证码字段
      if (captcha) {
        requestBody.captcha = captcha;
      }
      
      const response = await fetch(`/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      // 如果服务端返回需要验证码或验证码错误，前端需要获取验证码图片
      if (result.needCaptcha || (result.success === false && result.error && result.error.includes('验证码'))) {
        try {
          const captchaResponse = await this.getCaptcha();
          if (captchaResponse.success) {
            return {
              ...result,
              captchaData: captchaResponse.data
            };
          }
        } catch (error) {
          console.error('获取验证码失败:', error);
        }
      }
      
      return result;
    }
  }

  // 获取验证码
  async getCaptcha() {
    if (this.isLocalDev) {
      // 本地开发：模拟验证码
      return {
        success: true,
        data: {
          captcha_id: 'test_captcha_id',
          image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      };
    } else {
      // 生产环境：从后端API获取
      const response = await fetch(`/captcha`);
      return await response.json();
    }
  }
}

export default new ApiAdapter(); 