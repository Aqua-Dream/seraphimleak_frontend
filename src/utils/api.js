// API适配器 - 根据环境自动选择数据源
class ApiAdapter {
  constructor() {
    // 检测是否为本地开发环境
    this.isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.apiUrl = this.isLocalDev ? 'http://localhost:8001' : '/api';
  }

  // 获取统计数据
  async getStats() {
    const response = await fetch(`${this.apiUrl}/stats`);
    return await response.json();
  }

  // 获取所有评论数据（用于分页）
  async getAllComments() {
    const response = await fetch(`${this.apiUrl}/comments`);
    const data = await response.json();
    return data;
  }

  // 提交评论
  async submitComment(content, captcha = null, captchaId = null) {
    // 构建请求URL，验证码参数作为query参数
    let url = `${this.apiUrl}/comments`;
    
    if (captcha && captchaId) {
      const params = new URLSearchParams();
      params.append('captcha', captcha);
      params.append('captcha_id', captchaId);
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content })
    });

    const result = await response.json();

    // 如果服务端返回需要验证码或验证码错误，前端需要获取验证码图片
    if (result.captchaError === true) {
      var captchaResponse = {}
      try {
        captchaResponse = await this.getCaptcha();
      } catch (error) {
        console.error('获取验证码失败:', error);
      }
      return {
        ...result,
        captchaData: captchaResponse.data
      };
    }

    return result;
  }

  // 获取验证码
  async getCaptcha() {
    const response = await fetch(`${this.apiUrl}/captcha`);
    return await response.json();
  }
}

export default new ApiAdapter(); 