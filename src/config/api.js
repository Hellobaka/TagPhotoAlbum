// API 配置
const API_CONFIG = {
  // 后端 API 基础地址
  // 开发环境：空字符串（使用代理）
  // 生产环境：后端服务器地址，例如：'https://api.your-domain.com'
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '',

  // API 路径前缀
  API_PREFIX: '/api',

  // 图片上传路径
  UPLOAD_PATH: '/external',

  // HMAC 签名密钥（应与后端 JWT:Key 保持一致）
  HMAC_KEY: import.meta.env.VITE_HMAC_KEY || 'your-super-secret-key-that-should-be-at-least-32-characters-long'
}

export default API_CONFIG