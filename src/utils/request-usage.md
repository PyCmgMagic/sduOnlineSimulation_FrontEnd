# 网络请求类使用说明

本文档详细介绍了增强版网络请求类的使用方法，该类基于 Axios 构建，提供了丰富的功能和企业级特性。

## 📋 目录

- [快速开始](#快速开始)
- [基础使用](#基础使用)
- [高级功能](#高级功能)
- [错误处理](#错误处理)
- [配置管理](#配置管理)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 🚀 快速开始

### 安装依赖

```bash
npm install axios
```

### 导入使用

```typescript
import request from '@/utils/request';
```

## 📖 基础使用

### GET 请求

```typescript
// 基础 GET 请求
const userData = await request.get<User>('/user/123');

// 带参数的 GET 请求
const userList = await request.get<User[]>('/users', {
  params: {
    page: 1,
    limit: 10,
    status: 'active'
  }
});

// 带自定义配置的 GET 请求
const data = await request.get<Data>('/data', {
  timeout: 5000,
  headers: {
    'Custom-Header': 'custom-value'
  }
});
```

### POST 请求

```typescript
// 基础 POST 请求
const createResult = await request.post<CreateResult>('/user', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// 带自定义配置的 POST 请求
const result = await request.post<Result>('/api/submit', formData, {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});
```

### PUT 和 DELETE 请求

```typescript
// PUT 请求
const updateResult = await request.put<UpdateResult>('/user/123', {
  name: 'Updated Name',
  email: 'updated@example.com'
});

// PATCH 请求
const patchResult = await request.patch<PatchResult>('/user/123', {
  status: 'inactive'
});

// DELETE 请求
const deleteResult = await request.delete<DeleteResult>('/user/123');
```

## 🔧 高级功能

### 1. 请求重试机制

```typescript
// 配置重试参数
const data = await request.get<Data>('/unstable-api', {
  retry: 3,           // 重试次数
  retryDelay: 1000,   // 重试延迟(毫秒)
});

// 重试配置示例
const criticalData = await request.post<CriticalData>('/critical-operation', payload, {
  retry: 5,
  retryDelay: 2000,
  timeout: 10000
});
```

### 2. 缓存功能

```typescript
// 启用缓存
const cachedData = await request.get<Data>('/expensive-operation', {
  useCache: true,        // 启用缓存
  cacheTime: 300000,     // 缓存时间 5分钟
});

// 管理缓存
// 清空所有缓存
request.clearCache();

// 获取缓存统计
const stats = request.getCacheStats();
console.log(`缓存大小: ${stats.size}`);
console.log(`缓存键: ${stats.keys}`);
```

### 3. 文件上传

```typescript
// 单文件上传
const fileInput = document.getElementById('file') as HTMLInputElement;
const file = fileInput.files[0];

const uploadResult = await request.upload<UploadResult>('/upload', file, {
  timeout: 30000
}, (progressEvent) => {
  const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
  console.log(`上传进度: ${percent}%`);
  // 更新进度条
  updateProgressBar(percent);
});

// 多文件上传
const multipleFiles = document.getElementById('multiple-files') as HTMLInputElement;
const files = multipleFiles.files;

const multiUploadResult = await request.upload<MultiUploadResult>('/upload-multiple', files, {
  timeout: 60000
}, (progressEvent) => {
  const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
  console.log(`批量上传进度: ${percent}%`);
});

// 带额外数据的文件上传
const uploadWithData = await request.upload<UploadResult>('/upload-with-data', file, {
  data: {
    category: 'image',
    description: '用户头像'
  }
});
```

### 4. 文件下载

```typescript
// 基础文件下载
await request.download('/file/download/123', 'document.pdf');

// 带进度的文件下载
await request.download('/large-file/456', 'large-file.zip', {
  onDownloadProgress: (progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    console.log(`下载进度: ${percent}%`);
  }
});

// 动态文件名下载
const response = await request.get('/file/info/789');
const filename = response.originalName;
await request.download('/file/download/789', filename);
```

### 5. 并发请求处理

```typescript
// 并发执行多个请求
const concurrentResults = await request.concurrent([
  () => request.get<Users>('/users'),
  () => request.get<Posts>('/posts'),
  () => request.get<Comments>('/comments'),
  () => request.get<Categories>('/categories')
]);

const [users, posts, comments, categories] = concurrentResults;

// 处理部分失败的并发请求
const concurrentWithErrorHandling = await Promise.allSettled([
  request.get<Users>('/users'),
  request.get<Posts>('/posts'),
  request.get<Comments>('/comments')
]);

concurrentWithErrorHandling.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`请求 ${index} 成功:`, result.value);
  } else {
    console.error(`请求 ${index} 失败:`, result.reason);
  }
});
```

### 6. 串行请求处理

```typescript
// 串行执行依赖的请求
const sequentialResults = await request.sequential([
  () => request.post<Step1Result>('/workflow/step1', step1Data),
  () => request.post<Step2Result>('/workflow/step2', step2Data),
  () => request.post<Step3Result>('/workflow/step3', step3Data)
]);

const [step1Result, step2Result, step3Result] = sequentialResults;

// 基于前一个请求结果的串行请求
const chainedResults = await request.sequential([
  () => request.post<AuthResult>('/auth/login', credentials),
  () => request.get<Profile>('/user/profile'),
  () => request.get<Settings>('/user/settings')
]);
```

### 7. 请求取消

```typescript
// 取消特定请求
const controller = new AbortController();

try {
  const data = await request.get<Data>('/long-running-task', {
    signal: controller.signal
  });
} catch (error) {
  if (error.name === 'CanceledError') {
    console.log('请求已取消');
  }
}

// 5秒后取消请求
setTimeout(() => {
  controller.abort();
}, 5000);

// 取消所有进行中的请求
request.cancelAllRequests();

// 基于请求键取消
request.cancelRequest('user-profile-123');
```

## ⚠️ 错误处理

### 统一错误处理

```typescript
try {
  const data = await request.get<Data>('/api/data');
  // 处理成功响应
} catch (error) {
  // 网络请求类已经统一处理了常见错误
  if (error.response) {
    // 服务器响应错误
    console.error('服务器错误:', error.response.status, error.response.data);
  } else if (error.request) {
    // 请求发送失败
    console.error('网络错误:', error.message);
  } else {
    // 其他错误
    console.error('未知错误:', error.message);
  }
}
```

### 自定义错误处理

```typescript
// 为特定请求禁用全局错误处理
const customErrorData = await request.get<Data>('/api/data', {
  showErrorMessage: false
}).catch((error) => {
  // 自定义错误处理逻辑
  handleCustomError(error);
  return null;
});
```

## ⚙️ 配置管理

### 动态配置

```typescript
// 设置基础URL
request.setBaseURL('https://api.example.com');

// 设置超时时间
request.setTimeout(15000);

// 设置默认头部
request.setDefaultHeaders({
  'X-API-Key': 'your-api-key',
  'X-Client-Version': '1.0.0'
});

// 更新特定头部
request.setDefaultHeaders({
  'Authorization': `Bearer ${newToken}`
});
```

### 环境配置

```typescript
// 根据环境设置不同的基础URL
const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://api.production.com'
  : 'https://api.development.com';

request.setBaseURL(baseURL);
```

## 🎯 最佳实践

### 1. 类型定义

```typescript
// 定义API响应类型
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 使用类型化请求
const user = await request.get<User>('/user/123');
```

### 2. 错误边界

```typescript
// 创建带错误边界的请求包装器
async function safeRequest<T>(
  requestFn: () => Promise<T>,
  fallbackValue?: T
): Promise<T | null> {
  try {
    return await requestFn();
  } catch (error) {
    console.error('请求失败:', error);
    return fallbackValue || null;
  }
}

// 使用示例
const userData = await safeRequest(
  () => request.get<User>('/user/123'),
  { id: 0, name: 'Unknown', email: '' }
);
```

### 3. 请求防抖

```typescript
// 防止重复提交
let isSubmitting = false;

async function submitForm(formData: FormData) {
  if (isSubmitting) {
    console.log('请求正在进行中...');
    return;
  }
  
  isSubmitting = true;
  try {
    const result = await request.post<SubmitResult>('/submit', formData);
    console.log('提交成功:', result);
  } finally {
    isSubmitting = false;
  }
}
```

### 4. 批量操作

```typescript
// 批量处理数据
async function batchProcess(items: Item[]) {
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await request.concurrent(
      batch.map(item => () => request.post<ProcessResult>('/process', item))
    );
    results.push(...batchResults);
    
    // 批次间延迟，避免服务器过载
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

