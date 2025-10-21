// API 配置
const API_CONFIG = {
  // 后端 API 基础地址
  BASE_URL: 'http://localhost:5085',

  // API 路径前缀
  API_PREFIX: '/api',

  // 图片上传路径
  UPLOAD_PATH: '/external',

  // HMAC 签名密钥（应与后端 JWT:Key 保持一致）
  HMAC_KEY: 'your-super-secret-key-that-should-be-at-least-32-characters-long'
}

export default API_CONFIG