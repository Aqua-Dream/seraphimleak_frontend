# 组件文档

本项目已从单一的App.vue拆分成多个可复用的组件。

## 组件结构

### 1. MainArea.vue
**功能**: 主体区域组件，包含背景、标题、头像和下载按钮
**Props**:
- `selectedTieba`: 当前选中的贴吧对象
- `danmakuList`: 弹幕列表数组
**Events**:
- `goToTieba`: 点击标题时触发，跳转到贴吧

### 2. Sidebar.vue
**功能**: 侧边栏组件，显示贴吧列表
**Props**:
- `tiebaList`: 贴吧列表数组
**Events**:
- `switchTieba`: 点击贴吧时触发，切换选中的贴吧

### 3. CommentSection.vue
**功能**: 留言区域组件，包含输入框和留言列表
**Props**:
- `newComment`: 新留言内容
- `comments`: 留言列表数组
**Events**:
- `submitComment`: 提交留言时触发
- `update:newComment`: 更新留言内容时触发

### 4. ModalDialog.vue
**功能**: 通用弹窗组件，支持网站信息和验证码两种类型
**Props**:
- `visible`: 是否显示弹窗
- `type`: 弹窗类型 ('info' | 'captcha')
- `title`: 弹窗标题
- `stats`: 统计数据对象 (仅info类型)
- `captchaImage`: 验证码图片 (仅captcha类型)
- `captchaInput`: 验证码输入 (仅captcha类型)
- `isValidCaptcha`: 验证码是否有效 (仅captcha类型)
**Events**:
- `close`: 关闭弹窗时触发
- `refreshCaptcha`: 刷新验证码时触发 (仅captcha类型)
- `submitCaptcha`: 提交验证码时触发 (仅captcha类型)
- `validateCaptchaInput`: 验证码输入时触发 (仅captcha类型)

### 5. Footer.vue
**功能**: 底部信息组件
**Props**: 无
**Events**: 无

### 6. MusicPlayer.vue
**功能**: 音乐播放器组件，封装APlayer相关逻辑
**Props**:
- `selectedTieba`: 当前选中的贴吧对象
- `isPlaying`: 是否正在播放
**Events**:
- `play`: 开始播放时触发
- `pause`: 暂停播放时触发
- `ended`: 播放结束时触发
- `error`: 播放错误时触发

## 使用方式

```vue
<template>
  <div>
    <MainArea 
      :selected-tieba="selectedTieba" 
      :danmaku-list="danmakuList"
      @go-to-tieba="goToTieba"
    />
    
    <Sidebar 
      :tieba-list="tiebaList" 
      @switch-tieba="switchTieba"
    />
    
    <CommentSection 
      :new-comment="newComment"
      :comments="comments"
      @submit-comment="submitComment"
      @update:new-comment="newComment = $event"
    />
    
    <ModalDialog 
      :visible="showBanner"
      type="info"
      title="网站信息"
      :stats="{ clickCount, userCount }"
      @close="closeBanner"
    />
    
    <Footer />
    
    <MusicPlayer 
      :selected-tieba="selectedTieba"
      :is-playing="isPlaying"
      @play="handlePlay"
      @pause="handlePause"
      @ended="handleEnded"
      @error="handleError"
    />
  </div>
</template>
```

## 组件优势

1. **可复用性**: 每个组件都有明确的职责，可以在其他项目中复用
2. **可维护性**: 代码结构清晰，便于维护和调试
3. **可测试性**: 每个组件都可以独立测试
4. **可扩展性**: 新增功能时只需要修改对应的组件
5. **性能优化**: 组件化后可以更好地利用Vue的响应式系统

## 注意事项

1. 所有组件都使用Composition API (script setup)
2. 组件间通信主要通过props和events
3. 样式仍然使用全局CSS文件 (main.css)
4. 音乐播放器组件需要APlayer库支持 