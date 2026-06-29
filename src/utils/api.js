// API适配器 - 归档版本
// 网站后端服务已下线，原先依赖的接口数据已快照写入 src/data 下的静态文件。
import commentsData from '../data/comments.json'
import statsData from '../data/stats.json'
import archiveData from '../data/archive.json'

class ApiAdapter {
  constructor() {
    this.comments = commentsData.comments || []
    this.stats = statsData
    this.archivedAt = archiveData.archivedAt
  }

  // 获取统计数据
  async getStats() {
    return { ...this.stats }
  }

  // 获取所有评论数据（用于分页）
  async getAllComments() {
    return { comments: this.comments.map((c) => ({ ...c })) }
  }

  // 提交评论（归档站只读，不可提交）
  async submitComment() {
    return { success: false, error: '网站已归档' }
  }

  // 获取验证码（归档站不可用）
  async getCaptcha() {
    return { success: false, error: '网站已归档' }
  }
}

export default new ApiAdapter();
