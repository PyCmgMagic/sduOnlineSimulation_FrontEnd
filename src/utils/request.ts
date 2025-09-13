import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';

// 扩展AxiosRequestConfig接口以支持metadata
declare module 'axios' {
    export interface AxiosRequestConfig {
        metadata?: {
            requestId: string;
            startTime: number;
        };
    }
}

// 定义API返回数据的结构
interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
}

// 请求配置接口
interface RequestConfig extends AxiosRequestConfig {
    retry?: number; // 重试次数
    retryDelay?: number; // 重试延迟时间(ms)
    showErrorMessage?: boolean; // 是否显示错误消息
    useCache?: boolean; // 是否使用缓存
    cacheTime?: number; // 缓存时间(ms)
}

// 缓存项接口
interface CacheItem {
    data: any;
    timestamp: number;
    expiry: number;
}

// 上传进度回调函数类型
type UploadProgressCallback = (progressEvent: any) => void;

class Request {
    private static instance: Request;
    private axiosInstance: AxiosInstance;
    private cancelTokens: Map<string, CancelTokenSource> = new Map(); // 存储取消令牌
    private cache: Map<string, CacheItem> = new Map(); // 请求缓存
    private requestQueue: Set<string> = new Set(); // 请求队列，防止重复请求
    
    /**
     * 私有构造函数，遵循单例模式
     */
    private constructor() {
        let baseUrl = 'http://localhost:3000/api'; // 默认地址
        try {
            // 从.env文件中读取VITE_BASE_URL环境变量
            const envBaseUrl = import.meta.env.VITE_BASE_URL;
            if (envBaseUrl) {
                baseUrl = envBaseUrl.trim();
                console.log('从环境变量加载API基础URL:', baseUrl);
            } else {
                console.warn('未找到VITE_BASE_URL环境变量，使用默认地址');
            }
        } catch (e) {
            console.error("解析环境变量失败，使用默认地址。错误:", e);
        }

        this.axiosInstance = axios.create({
            baseURL: baseUrl, // 从环境变量加载API基础URL
            timeout: 10000, // 请求超时时间，10秒
            withCredentials: true, // 允许跨域携带 Cookie
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
            },
        });

        this.setupInterceptors();
        this.startCacheCleanup();
    }

    // 获取单例实例的静态方法
    public static getInstance(): Request {
        if (!Request.instance) {
            Request.instance = new Request();
        }
        return Request.instance;
    }

    // 设置请求和响应拦截器
    private setupInterceptors(): void {
        // 请求拦截器
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // 在此处修改请求配置，例如添加认证令牌
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                
                // 添加请求ID用于日志跟踪
                const requestId = this.generateRequestId();
                config.metadata = { requestId, startTime: Date.now() };
                
                // 记录请求日志
                this.logRequest(config);
                
                return config;
            },
            (error) => {
                // 处理请求错误
                console.error('请求错误:', error);
                return Promise.reject(error);
            }
        );

        // 响应拦截器
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse<ApiResponse>) => {
                const { data } = response;
                
                // 记录响应日志
                this.logResponse(response);
                
                // 在此处根据返回的code统一处理API错误
                if (data.code !== 200) {
                    // 处理API错误 (例如，显示通知)
                    console.error('API 错误:', data.message);
                    // 抛出错误，以便调用代码可以捕获
                    return Promise.reject(new Error(data.message || 'Error'));
                }
                return data.data; // 只返回响应数据中的'data'部分
            },
            (error) => {
                // 记录错误日志
                this.logError(error);
                
                // 处理网络错误
                console.error('网络错误:', error);
                
                // 可以根据不同的HTTP状态码进行更具体的错误处理
                if (error.response) {
                    switch (error.response.status) {
                        case 302:
                            // 处理重定向，通常表示需要重新登录
                            this.handleRedirect(error.response);
                            break;
                        case 401:
                            // 处理未授权错误，例如重定向到登录页
                            this.handleUnauthorized();
                            break;
                        case 403:
                            // 处理禁止访问错误
                            this.handleForbidden();
                            break;
                        case 404:
                            // 处理未找到错误
                            this.handleNotFound();
                            break;
                        case 500:
                            // 处理服务器错误
                            this.handleServerError();
                            break;
                        default:
                            // 处理其他HTTP错误
                            this.handleOtherError(error.response.status);
                            break;
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    // 生成请求ID
    private generateRequestId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 记录请求日志
    private logRequest(config: any): void {
        if (this.isDevelopment()) {
            console.log(`[请求] ${config.method?.toUpperCase()} ${config.url}`, {
                requestId: config.metadata?.requestId,
                data: config.data,
                params: config.params,
            });
        }
    }

    // 记录响应日志
    private logResponse(response: AxiosResponse): void {
        if (this.isDevelopment()) {
            const duration = response.config.metadata?.startTime ? Date.now() - response.config.metadata.startTime : 0;
            console.log(`[响应] ${response.status} ${response.config.url}`, {
                requestId: response.config.metadata?.requestId,
                duration: `${duration}ms`,
                data: response.data,
            });
        }
    }

    // 记录错误日志
    private logError(error: any): void {
        if (this.isDevelopment()) {
            const duration = error.config?.metadata?.startTime ? Date.now() - error.config.metadata.startTime : 0;
            console.error(`[错误] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                requestId: error.config?.metadata?.requestId,
                duration: `${duration}ms`,
                error: error.message,
            });
        }
    }

    // 检查是否为开发环境
    private isDevelopment(): boolean {
        return typeof globalThis !== 'undefined' && 
               globalThis.location?.hostname === 'localhost' ||
               globalThis.location?.hostname === '127.0.0.1' ||
               globalThis.location?.port !== '';
    }

    // 错误处理方法
    private handleRedirect(response: any): void {
        console.warn('🔄 检测到302重定向，登录态可能已失效');

        // 获取重定向的目标URL
        const redirectUrl = response.headers?.location || response.headers?.Location;

        if (redirectUrl) {
            console.log('🔗 重定向目标URL:', redirectUrl);

            // 清除本地存储的认证信息
            this.clearAuthData();

            // 如果重定向URL包含登录相关路径，直接跳转
            if (redirectUrl.includes('/login') || redirectUrl.includes('/auth')) {
                console.log('🚀 自动跳转到登录页面:', redirectUrl);
                window.location.href = redirectUrl;
            } else {
                // 否则跳转到主页面，让用户重新登录
                console.log('🏠 跳转到主页面重新登录');
                window.location.href = '/';
            }
        } else {
            // 没有重定向URL，清除认证信息并提示用户
            this.clearAuthData();
            console.warn('⚠️ 登录态已失效，请重新登录');
            alert('登录态已失效，请重新登录');
            window.location.href = '/';
        }
    }

    private handleUnauthorized(): void {
        // 清除本地存储的认证信息
        this.clearAuthData();
        // 可以在这里添加重定向到登录页的逻辑
        console.warn('用户未授权，请重新登录');
    }

    // 清除认证数据的通用方法
    private clearAuthData(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('lastLoginTime');
    }

    private handleForbidden(): void {
        console.warn('访问被禁止');
    }

    private handleNotFound(): void {
        console.warn('请求的资源不存在');
    }

    private handleServerError(): void {
        console.warn('服务器内部错误');
    }

    private handleOtherError(status: number): void {
        console.warn(`HTTP错误: ${status}`);
    }

    // 启动缓存清理任务
    private startCacheCleanup(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [key, item] of this.cache.entries()) {
                if (now > item.expiry) {
                    this.cache.delete(key);
                }
            }
        }, 60000); // 每分钟清理一次过期缓存
    }

    // 生成缓存键
    private generateCacheKey(url: string, config?: AxiosRequestConfig): string {
        return `${url}_${JSON.stringify(config?.params || {})}_${JSON.stringify(config?.data || {})}`;
    }

    // 获取缓存数据
    private getCacheData(key: string): any | null {
        const item = this.cache.get(key);
        if (item && Date.now() < item.expiry) {
            return item.data;
        }
        return null;
    }

    // 设置缓存数据
    private setCacheData(key: string, data: any, cacheTime: number = 300000): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiry: Date.now() + cacheTime,
        });
    }

    // 重试请求
    private async retryRequest<T>(
        requestFn: () => Promise<T>,
        retry: number,
        retryDelay: number
    ): Promise<T> {
        try {
            return await requestFn();
        } catch (error) {
            if (retry > 0) {
                console.log(`请求失败，${retryDelay}ms后重试，剩余重试次数: ${retry}`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.retryRequest(requestFn, retry - 1, retryDelay);
            }
            throw error;
        }
    }

    // 创建取消令牌
    private createCancelToken(key: string): CancelTokenSource {
        const source = axios.CancelToken.source();
        this.cancelTokens.set(key, source);
        return source;
    }

    // 取消请求
    public cancelRequest(key: string): void {
        const source = this.cancelTokens.get(key);
        if (source) {
            source.cancel(`请求 ${key} 已被取消`);
            this.cancelTokens.delete(key);
        }
    }

    // 取消所有请求
    public cancelAllRequests(): void {
        this.cancelTokens.forEach((source, key) => {
            source.cancel(`请求 ${key} 已被取消`);
        });
        this.cancelTokens.clear();
    }

    // 检查是否为重复请求
    private isDuplicateRequest(key: string): boolean {
        return this.requestQueue.has(key);
    }

    // 添加请求到队列
    private addToQueue(key: string): void {
        this.requestQueue.add(key);
    }

    // 从队列中移除请求
    private removeFromQueue(key: string): void {
        this.requestQueue.delete(key);
    }

    // 通用请求方法
    private async request<T>(
        method: string,
        url: string,
        data?: any,
        config: RequestConfig = {}
    ): Promise<T> {
        const {
            retry = 0,
            retryDelay = 1000,
            useCache = false,
            cacheTime = 300000,
            ...axiosConfig
        } = config;

        // 生成请求唯一标识
        const requestKey = this.generateCacheKey(url, { ...axiosConfig, data });

        // 检查缓存
        if (useCache && method.toUpperCase() === 'GET') {
            const cachedData = this.getCacheData(requestKey);
            if (cachedData) {
                console.log(`[缓存命中] ${url}`);
                return cachedData;
            }
        }

        // 检查重复请求
        if (this.isDuplicateRequest(requestKey)) {
            console.warn(`[重复请求] ${url} 请求正在进行中`);
            return Promise.reject(new Error('请求正在进行中，请勿重复提交'));
        }

        // 创建取消令牌
        const cancelToken = this.createCancelToken(requestKey);
        axiosConfig.cancelToken = cancelToken.token;

        // 添加到请求队列
        this.addToQueue(requestKey);

        const requestFn = async (): Promise<T> => {
            try {
                const response = await this.axiosInstance.request<ApiResponse<T>>({
                    method: method as any,
                    url,
                    data,
                    ...axiosConfig,
                });

                const result = response as unknown as T;

                // 如果是GET请求且启用缓存，则缓存结果
                if (useCache && method.toUpperCase() === 'GET') {
                    this.setCacheData(requestKey, result, cacheTime);
                }

                return result;
            } finally {
                // 清理
                this.removeFromQueue(requestKey);
                this.cancelTokens.delete(requestKey);
            }
        };

        // 执行请求（带重试机制）
        if (retry > 0) {
            return this.retryRequest(requestFn, retry, retryDelay);
        } else {
            return requestFn();
        }
    }

    // 封装GET请求
    public get<T = any>(url: string, config?: RequestConfig): Promise<T> {
        return this.request<T>('GET', url, undefined, config);
    }

    // 封装POST请求
    public post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
        return this.request<T>('POST', url, data, config);
    }

    // 封装PUT请求
    public put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
        return this.request<T>('PUT', url, data, config);
    }

    // 封装DELETE请求
    public delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
        return this.request<T>('DELETE', url, undefined, config);
    }

    // 封装PATCH请求
    public patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
        return this.request<T>('PATCH', url, data, config);
    }

    // 文件上传
    public upload<T = any>(
        url: string,
        file: File | FileList,
        config?: RequestConfig,
        onUploadProgress?: UploadProgressCallback
    ): Promise<T> {
        const formData = new FormData();
        
        if (file instanceof FileList) {
            Array.from(file).forEach((f, index) => {
                formData.append(`file${index}`, f);
            });
        } else {
            formData.append('file', file);
        }

        return this.request<T>('POST', url, formData, {
            ...config,
            headers: {
                'Content-Type': 'multipart/form-data',
                ...config?.headers,
            },
            onUploadProgress,
        });
    }

    // 下载文件
    public download(url: string, filename?: string, config?: RequestConfig): Promise<void> {
        return this.request<Blob>('GET', url, undefined, {
            ...config,
            responseType: 'blob',
        }).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        });
    }

    // 并发请求
    public concurrent<T = any>(requests: Array<() => Promise<T>>): Promise<T[]> {
        return Promise.all(requests.map(request => request()));
    }

    // 串行请求
    public sequential<T = any>(requests: Array<() => Promise<T>>): Promise<T[]> {
        return requests.reduce(async (previousPromise, currentRequest) => {
            const results = await previousPromise;
            const result = await currentRequest();
            return [...results, result];
        }, Promise.resolve([] as T[]));
    }

    // 设置基础URL
    public setBaseURL(baseURL: string): void {
        this.axiosInstance.defaults.baseURL = baseURL;
    }

    // 设置超时时间
    public setTimeout(timeout: number): void {
        this.axiosInstance.defaults.timeout = timeout;
    }

    // 设置默认头部
    public setDefaultHeaders(headers: Record<string, string>): void {
        Object.assign(this.axiosInstance.defaults.headers, headers);
    }

    // 清空缓存
    public clearCache(): void {
        this.cache.clear();
    }

    // 获取缓存统计信息
    public getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

// 导出单例实例
export default Request.getInstance();

// 导出类型定义
export type { RequestConfig, UploadProgressCallback };

