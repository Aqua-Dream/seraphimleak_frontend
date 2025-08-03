// 评论处理模块
class CommentHandler {
  constructor(app) {
    this.app = app;
    this.captchaId = null;
  }

  // 提交评论
  async submitComment() {
    if (!this.app.newComment.trim()) {
      alert('请输入留言内容');
      return;
    }

    try {
      const result = await this.app.apiAdapter.submitComment(this.app.newComment);
      
      if (result.success) {
        // 添加新评论到列表
        const newComment = {
          id: result.id,
          content: result.content,
          time: result.time
        };
        
        this.app.comments.unshift(newComment);
        this.app.newComment = '';
        
        // 添加新弹幕
        if (this.app.insertDanmakus) {
          this.app.insertDanmakus(newComment);
        }
        
        // 显示成功消息
        console.log('评论提交成功');
      } else {
        // 处理需要验证码的情况
        if (result.captchaData) {
          this.showCaptchaDialog(result);
        } else {
          alert(result.error || '提交失败，请重试');
        }
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      alert('提交失败，请重试');
    }
  }

  // 显示验证码对话框
  showCaptchaDialog(result) {
    this.app.captchaImage = result.captchaData.image;
    this.app.captchaId = result.captchaData.captcha_id;
    this.app.showCaptcha = true;
    this.app.captchaInput = '';
    
    // 等待DOM更新后聚焦输入框
    this.app.nextTick(() => {
      const captchaInput = document.querySelector('.captcha-input');
      if (captchaInput) {
        captchaInput.focus();
      }
    });
  }

  // 刷新验证码
  async refreshCaptcha() {
    try {
      const result = await this.app.apiAdapter.getCaptcha();
      if (result.success) {
        this.app.captchaImage = result.data.image;
        this.app.captchaId = result.data.captcha_id;
        this.app.captchaInput = '';
      }
    } catch (error) {
      console.error('刷新验证码失败:', error);
      alert('刷新验证码失败，请重试');
    }
  }

  // 关闭验证码对话框
  closeCaptcha() {
    this.app.showCaptcha = false;
    this.app.captchaImage = '';
    this.app.captchaInput = '';
    this.app.captchaId = null;
  }

  // 验证验证码格式
  validateCaptchaFormat(captcha) {
    return /^\d{6}$/.test(captcha);
  }

  // 验证验证码输入
  validateCaptchaInput() {
    // 只允许输入数字
    this.app.captchaInput = this.app.captchaInput.replace(/[^\d]/g, '');
  }

  // 提交验证码
  async submitCaptcha() {
    if (!this.app.captchaInput.trim()) {
      return;
    }
    
    // 验证验证码格式：必须是6位数字
    if (!this.validateCaptchaFormat(this.app.captchaInput)) {
      alert('验证码必须是6位数字');
      return;
    }

    try {
      const result = await this.app.apiAdapter.submitComment(
        this.app.newComment, 
        this.app.captchaInput
      );
      
      if (result.success) {
        // 添加新评论到列表
        const newComment = {
          id: result.id,
          content: result.content,
          time: result.time
        };
        
        this.app.comments.unshift(newComment);
        this.app.newComment = '';
        this.closeCaptcha();
        
        // 添加新弹幕
        if (this.app.insertDanmakus) {
          this.app.insertDanmakus(newComment);
        }
        
        // 显示成功消息
        console.log('评论提交成功');
      } else {
        if (result.captchaData) {
          // 验证码错误，刷新验证码
          this.app.captchaImage = result.captchaData.image;
          this.app.captchaId = result.captchaData.captcha_id;
          this.app.captchaInput = '';
          alert('验证码错误，请重新输入');
        } else {
          alert(result.error || '提交失败，请重试');
        }
      }
    } catch (error) {
      console.error('提交验证码失败:', error);
      alert('提交失败，请重试');
    }
  }
}

export default CommentHandler; 