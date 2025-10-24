# 通行密钥 (Passkey) API 文档

## 概述

通行密钥是一种基于 WebAuthn 标准的现代认证方法，允许用户使用生物识别（指纹、面部识别）或设备 PIN 码进行身份验证，无需密码。

## API 端点

### 1. 获取注册选项

**端点**: `POST /api/passkey/registration-options`

**请求体**:
```json
{
  "username": "user123",
  "displayName": "张三",
  "email": "user@example.com"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "challenge": "base64-encoded-challenge",
    "rp": {
      "name": "TagPhotoAlbum",
      "id": "localhost"
    },
    "user": {
      "id": "base64-user-id",
      "name": "user123",
      "displayName": "张三"
    },
    "pubKeyCredParams": [
      { "type": "public-key", "alg": -7 },
      { "type": "public-key", "alg": -257 }
    ],
    "authenticatorSelection": {
      "authenticatorAttachment": "platform",
      "requireResidentKey": true,
      "userVerification": "preferred"
    },
    "timeout": 60000,
    "attestation": "none"
  }
}
```

### 2. 获取认证选项

**端点**: `POST /api/passkey/authentication-options`

**请求体**:
```json
"user123"
```

**响应**:
```json
{
  "success": true,
  "data": {
    "challenge": "base64-encoded-challenge",
    "timeout": 60000,
    "relyingPartyId": "localhost",
    "allowCredentials": ["credential-id-1", "credential-id-2"],
    "userVerification": "preferred"
  }
}
```

### 3. 注册通行密钥

**端点**: `POST /api/passkey/register`

**请求体**:
```json
{
  "response": {
    "id": "credential-id",
    "rawId": "raw-credential-id",
    "response": {
      "clientDataJSON": "base64-client-data",
      "attestationObject": "base64-attestation-object",
      "transports": ["internal"]
    },
    "type": "public-key"
  },
  "challenge": "original-challenge"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "credentialId": "credential-id"
  }
}
```

### 4. 使用通行密钥认证

**端点**: `POST /api/passkey/authenticate`

**请求体**:
```json
{
  "response": {
    "id": "credential-id",
    "rawId": "raw-credential-id",
    "response": {
      "clientDataJSON": "base64-client-data",
      "authenticatorData": "base64-authenticator-data",
      "signature": "base64-signature",
      "userHandle": "base64-user-handle"
    },
    "type": "public-key"
  },
  "challenge": "original-challenge"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "token": "jwt-token",
    "user": {
      "id": 1,
      "username": "user123",
      "name": "张三",
      "email": "user@example.com"
    }
  }
}
```

### 5. 获取用户通行密钥列表

**端点**: `GET /api/passkey/user-passkeys`

**认证**: 需要 JWT Token

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "credentialId": "credential-id",
      "deviceType": "Platform Authenticator",
      "deviceName": "Default Device",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastUsedAt": "2024-01-01T12:00:00Z",
      "isActive": true
    }
  ]
}
```

### 6. 删除通行密钥

**端点**: `DELETE /api/passkey/{passkeyId}`

**认证**: 需要 JWT Token

**响应**:
```json
{
  "success": true,
  "data": true
}
```

## 使用流程

### 注册新通行密钥
1. 调用 `/api/passkey/registration-options` 获取注册选项
2. 在客户端使用 `navigator.credentials.create()` 创建通行密钥
3. 调用 `/api/passkey/register` 完成注册

### 使用通行密钥登录
1. 调用 `/api/passkey/authentication-options` 获取认证选项
2. 在客户端使用 `navigator.credentials.get()` 进行认证
3. 调用 `/api/passkey/authenticate` 完成认证并获取 JWT Token

## 安全特性

- **防钓鱼攻击**: 依赖方 ID 绑定到特定域名
- **防重放攻击**: 使用一次性挑战 (challenge)
- **生物识别**: 支持指纹、面部识别等生物特征
- **设备绑定**: 通行密钥与特定设备绑定

## 配置

在 `appsettings.json` 中添加以下配置：

```json
{
  "Passkey": {
    "RelyingParty": {
      "Name": "TagPhotoAlbum",
      "Id": "localhost"
    }
  }
}
```

**注意**: 在生产环境中，`RelyingParty.Id` 应设置为实际的域名。

## 浏览器支持

通行密钥需要现代浏览器支持：
- Chrome 67+
- Firefox 60+
- Safari 13+
- Edge 79+

## 移动设备支持

- iOS 16+ (iPhone/iPad)
- Android 9+ (需要 Google Play Services)
- Windows Hello (Windows 10+)