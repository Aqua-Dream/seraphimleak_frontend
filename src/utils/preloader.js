class ResourcePreloader {
  constructor() {
    this.tiebaList = null;
  }

  // 初始化贴吧列表数据
  async initTiebaList() {
    if (this.tiebaList) {
      return this.tiebaList;
    }

    try {
      // 动态导入 tieba-list.json
      const tiebaListModule = await import('../data/tieba-list.json');
      this.tiebaList = tiebaListModule.default || tiebaListModule;
      return this.tiebaList;
    } catch (error) {
      console.error('加载贴吧列表失败:', error);
      throw error;
    }
  }

  // 加载指定ID的贴吧资源
  async loadTiebaResources(tiebaId) {
    await this.initTiebaList();
    
    const tieba = this.tiebaList.find(t => t.id === tiebaId);
    if (!tieba) {
      console.warn(`未找到ID为 ${tiebaId} 的贴吧`);
      return { backgroundImages: [], music: [], avatar: [] };
    }

    const resources = {
      backgroundImages: [],
      music: [],
      avatar: []
    };

    // 收集背景图片
    if (tieba.backgroundImages && Array.isArray(tieba.backgroundImages)) {
      resources.backgroundImages = tieba.backgroundImages;
    }

    // 收集音乐文件
    if (tieba.songs && Array.isArray(tieba.songs)) {
      resources.music = tieba.songs.map(song => song.url).filter(url => url);
    }

    // 收集头像
    if (tieba.avatar) {
      resources.avatar = [tieba.avatar];
    }

    return resources;
  }

  // 加载所有贴吧的资源
  async loadAllTiebaResources() {
    await this.initTiebaList();
    
    const allResources = {
      backgroundImages: [],
      music: [],
      avatar: []
    };

    // 遍历所有贴吧收集资源
    for (const tieba of this.tiebaList) {
      const resources = await this.loadTiebaResources(tieba.id);
      allResources.backgroundImages.push(...resources.backgroundImages);
      allResources.music.push(...resources.music);
      allResources.avatar.push(...resources.avatar);
    }

    return allResources;
  }

  // 预加载所有资源（按优先级：头像 -> 背景图片 -> 音乐）
  preloadAllResources() {
    // 检查浏览器是否支持 requestIdleCallback
    if (!window.requestIdleCallback) {
      console.warn('浏览器不支持 requestIdleCallback，跳过预加载');
      return;
    }

    // 使用 requestIdleCallback 在浏览器空闲时预加载资源
    window.requestIdleCallback(async () => {
      try {
        const allResources = await this.loadAllTiebaResources();
        await this._preloadResources(allResources);
      } catch (error) {
        console.error('预加载资源时发生错误:', error);
      }
    });
  }

  // 预加载指定贴吧的资源（按优先级：头像 -> 背景图片 -> 音乐）
  preloadTiebaResources(tiebaId) {
    // 检查浏览器是否支持 requestIdleCallback
    if (!window.requestIdleCallback) {
      console.warn('浏览器不支持 requestIdleCallback，跳过预加载');
      return;
    }

    // 使用 requestIdleCallback 在浏览器空闲时预加载资源
    window.requestIdleCallback(async () => {
      try {
        const resources = await this.loadTiebaResources(tiebaId);
        await this._preloadResources(resources);
      } catch (error) {
        console.error(`预加载贴吧 ${tiebaId} 资源时发生错误:`, error);
      }
    });
  }

  // 按优先级顺序预加载资源：头像 -> 背景图片 -> 音乐
  async _preloadResources(resources) {
    const { backgroundImages, music, avatar } = resources;
    
    console.log('开始按优先级预加载资源...');
    
    // 第一优先级：头像（最重要，最先加载）
    if (avatar.length > 0) {
      console.log(`第1优先级 - 开始预加载头像 (${avatar.length} 个)`);
      const avatarPromises = avatar.map((avatarUrl, index) => 
        this._preloadSingleImage(avatarUrl, index + 1, avatar.length, '头像')
      );
      const avatarResults = await Promise.allSettled(avatarPromises);
      this._logResults('头像', avatarResults);
    }

    // 第二优先级：背景图片
    if (backgroundImages.length > 0) {
      console.log(`第2优先级 - 开始预加载背景图片 (${backgroundImages.length} 个)`);
      const imagePromises = backgroundImages.map((imageUrl, index) => 
        this._preloadSingleImage(imageUrl, index + 1, backgroundImages.length, '背景图片')
      );
      const imageResults = await Promise.allSettled(imagePromises);
      this._logResults('背景图片', imageResults);
    }

    // 第三优先级：音乐文件（最后加载，因为通常不是立即需要的）
    if (music.length > 0) {
      console.log(`第3优先级 - 开始预加载音乐文件 (${music.length} 个)`);
      const musicPromises = music.map((audioUrl, index) => 
        this._preloadSingleAudio(audioUrl, index + 1, music.length, '音乐')
      );
      const musicResults = await Promise.allSettled(musicPromises);
      this._logResults('音乐', musicResults);
    }

    console.log('所有优先级资源预加载完成！');
  }

  // 记录预加载结果
  _logResults(type, results) {
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    console.log(`${type}预加载完成: 成功 ${successful} 个, 失败 ${failed} 个`);
  }

  // 预加载单张图片
  _preloadSingleImage(imageUrl, currentIndex, totalCount, type = '图片') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve(imageUrl);
      };
      
      img.onerror = () => {
        console.warn(`${type}预加载失败 (${currentIndex}/${totalCount}): ${imageUrl}`);
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };
      
      // 设置图片源，开始加载
      img.src = imageUrl;
    });
  }

  // 预加载单个音频文件
  _preloadSingleAudio(audioUrl, currentIndex, totalCount, type = '音频') {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.oncanplaythrough = () => {
        resolve(audioUrl);
      };
      
      audio.onerror = () => {
        console.warn(`${type}预加载失败 (${currentIndex}/${totalCount}): ${audioUrl}`);
        reject(new Error(`Failed to load audio: ${audioUrl}`));
      };
      
      // 设置音频源，开始加载
      audio.src = audioUrl;
      audio.preload = 'metadata';
    });
  }
}

export default new ResourcePreloader();
