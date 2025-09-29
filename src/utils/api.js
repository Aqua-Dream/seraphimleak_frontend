/*
 * @Author: 刘凯欣 18532285824@163.com
 * @Date: 2025-09-11 11:41:15
 * @LastEditors: 刘凯欣 18532285824@163.com
 * @LastEditTime: 2025-09-11 14:06:27
 * @Description: 
 */
// API适配器 - 根据环境自动选择数据源
class ApiAdapter {
  constructor() {
    // 检测是否为本地开发环境
    this.isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // this.apiUrl = this.isLocalDev ? 'http://localhost:8001' : '/api';
    this.apiUrl = 'http://seraphimleak.com/api';
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
  async submitComment(content, color="#ffffff", captcha = null, captchaId = null) {
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
      body: JSON.stringify({ 
        content,
        color
      })
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

  // 预加载背景图片和音频文件
  preloadBackgroundImages() {
    // 检查浏览器是否支持 requestIdleCallback
    if (!window.requestIdleCallback) {
      return;
    }

    // 使用 requestIdleCallback 在浏览器空闲时预加载图片和音频
    // 只在浏览器真正空闲时才执行，不强制执行
    window.requestIdleCallback(() => {
      this._preloadImages();
    });
  }

  // 实际的图片和音频预加载逻辑
  async _preloadImages() {
    try {
      // 动态导入 tieba-list.json
      const tiebaListModule = await import('../data/tieba-list.json');
      const tiebaList = tiebaListModule.default || tiebaListModule;
      
      // 收集所有背景图片URL
      const backgroundImages = [];
      tiebaList.forEach(tieba => {
        if (tieba.backgroundImages && Array.isArray(tieba.backgroundImages)) {
          backgroundImages.push(...tieba.backgroundImages);
        }
      });

      // 收集所有音频文件URL
      const audioFiles = [];
      tiebaList.forEach(tieba => {
        if (tieba.songs && Array.isArray(tieba.songs)) {
          tieba.songs.forEach(song => {
            if (song.url) {
              audioFiles.push(song.url);
            }
          });
        }
      });

      console.log(`开始预加载 ${backgroundImages.length} 张背景图片和 ${audioFiles.length} 个音频文件`);

      // 预加载图片
      const imagePreloadPromises = backgroundImages.map((imageUrl, index) => 
        this._preloadSingleImage(imageUrl, index + 1, backgroundImages.length)
      );

      // 预加载音频
      const audioPreloadPromises = audioFiles.map((audioUrl, index) => 
        this._preloadSingleAudio(audioUrl, index + 1, audioFiles.length)
      );

      // 合并所有预加载任务
      const allPreloadPromises = [...imagePreloadPromises, ...audioPreloadPromises];
      const results = await Promise.allSettled(allPreloadPromises);
      
      // 统计预加载结果
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`资源预加载完成: 成功 ${successful} 个, 失败 ${failed} 个`);
      
    } catch (error) {
      console.error('预加载资源时发生错误:', error);
    }
  }

  // 预加载单张图片
  _preloadSingleImage(imageUrl, currentIndex, totalCount) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        console.log(`预加载完成 (${currentIndex}/${totalCount}): ${imageUrl}`);
        resolve(imageUrl);
      };
      
      img.onerror = () => {
        console.warn(`预加载失败 (${currentIndex}/${totalCount}): ${imageUrl}`);
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };
      
      // 设置图片源，开始加载
      img.src = imageUrl;
    });
  }

  // 预加载单个音频文件
  _preloadSingleAudio(audioUrl, currentIndex, totalCount) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.oncanplaythrough = () => {
        console.log(`音频预加载完成 (${currentIndex}/${totalCount}): ${audioUrl}`);
        resolve(audioUrl);
      };
      
      audio.onerror = () => {
        console.warn(`音频预加载失败 (${currentIndex}/${totalCount}): ${audioUrl}`);
        reject(new Error(`Failed to load audio: ${audioUrl}`));
      };
      
      // 设置音频源，开始加载
      audio.src = audioUrl;
      audio.preload = 'auto';
    });
  }
}

export default new ApiAdapter(); 