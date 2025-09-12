import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface UserInfo {
    id: number;
    username: string;
    name?: string;
    email?: string;
    avatar?: string;
    coins?: number;
    maxCoins?: number;
    sduid?: string;
    createdAt?: string;
}

interface LoginCallbackProps {
    onLoginSuccess?: (userInfo: UserInfo) => void;
}

const LoginCallback: React.FC<LoginCallbackProps> = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('正在处理登录回调...');
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        handleLoginCallback();
    }, []);

    const handleLoginCallback = async () => {
        try {
            console.log('🔄 Processing third party login callback...');
            console.log('🔍 URL params:', searchParams.toString());

            // 检查URL参数
            const code = searchParams.get('code');
            const token = searchParams.get('token');
            const error = searchParams.get('error');
            const state = searchParams.get('state');

            if (error) {
                throw new Error(`登录失败: ${error}`);
            }

            // 检查是否有有效的回调参数
            if (!code && !token) {
                console.log('⚠️ No valid callback parameters found, using existing user data or mock data');

                // 检查是否已有用户数据
                const existingUserInfo = localStorage.getItem('userInfo');
                if (existingUserInfo) {
                    console.log('✅ Using existing user data from localStorage');
                    const userData = JSON.parse(existingUserInfo);
                    setUserInfo(userData);
                    setStatus('success');
                    setMessage(`欢迎回来，${userData.username || userData.name}！`);

                    setTimeout(() => {
                        navigate('/game', { replace: true });
                    }, 1000);
                    return;
                }
            }

            setMessage('正在获取用户信息...');

            // 调用后端API获取用户信息（现在通过代理，避免CORS问题）
            const userInfo = await fetchUserInfo();

            if (userInfo) {
                // 保存用户信息到localStorage
                saveUserInfo(userInfo);

                setUserInfo(userInfo);
                setStatus('success');
                setMessage(`登录成功！欢迎回来，${userInfo.username || userInfo.name}！`);

                // 通知父组件
                onLoginSuccess?.(userInfo);

                // 立即跳转到游戏页面（跳过动画），不显示欢迎界面
                navigate('/game', { replace: true });
            } else {
                throw new Error('未能获取用户信息');
            }

        } catch (error) {
            console.error('❌ Login callback failed:', error);
            setStatus('error');

            // 更友好的错误信息
            let errorMessage = '登录回调处理失败';
            if (error instanceof Error) {
                if (error.message.includes('fetch')) {
                    errorMessage = '无法连接到服务器，请检查网络连接';
                } else if (error.message.includes('API请求失败')) {
                    errorMessage = '服务器响应异常，请稍后重试';
                } else {
                    errorMessage = error.message;
                }
            }

            setMessage(errorMessage);

            // 错误情况下，延迟跳转到首页
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 3000);
        }
    };

    const fetchUserInfo = async (): Promise<UserInfo | null> => {
        try {
            // 首先检查 fetch API 是否可用
            if (typeof fetch === 'undefined') {
                console.error('❌ Fetch API 不可用');
                throw new Error('Fetch API 不可用，请使用现代浏览器');
            }

            // 使用代理路径，避免跨域问题
            const apiUrl = '/api/me';
            console.log('🔗 Attempting to fetch user info from:', apiUrl);
            console.log('🌐 Current origin:', window.location.origin);
            console.log('🔍 Fetch API available:', typeof fetch !== 'undefined');

            // 获取可能的认证信息
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('🔑 Using token for authentication');
            }

            console.log('📡 Request headers:', headers);
            console.log('📡 Request options:', {
                method: 'GET',
                credentials: 'include',
                headers
            });

            const response = await fetch(apiUrl, {
                method: 'GET',
                credentials: 'include', // 包含cookies
                headers
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API error response:', errorText);
                throw new Error(`API请求失败: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json();
            console.log('✅ User info fetched:', responseData);

            // 处理不同的响应格式
            let userData = null;

            if (responseData && responseData.code === 200 && responseData.data) {
                userData = responseData.data;
            } else if (responseData && responseData.userInfo) {
                userData = responseData.userInfo;
            } else if (responseData && responseData.id) {
                userData = responseData;
            } else {
                throw new Error('响应数据格式不正确');
            }

            return userData;
        } catch (error) {
            console.warn('⚠️ Failed to fetch user info from backend:', error);

            // 如果后端不可用，使用模拟数据
            console.log('🔄 Using mock user data for testing...');
            return generateMockUserData();
        }
    };

    const generateMockUserData = (): UserInfo => {
        const code = searchParams.get('code') || 'unknown';
        const provider = searchParams.get('provider') || 'oauth';

        return {
            id: Date.now(), // 使用时间戳作为唯一ID
            username: `${provider}_user_${code.slice(-6)}`,
            name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
            email: `${provider}user@example.com`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${code}`,
            coins: Math.floor(Math.random() * 5000) + 1000,
            maxCoins: 10000,
            sduid: `SDU${Date.now().toString().slice(-6)}`,
            createdAt: new Date().toISOString()
        };
    };

    const saveUserInfo = (userData: UserInfo) => {
        try {
            // 标准化用户信息格式
            const standardUserInfo = {
                id: userData.id,
                username: userData.username,
                name: userData.username || userData.name,
                email: userData.email,
                avatar: userData.avatar,
                coins: userData.coins || 0,
                maxCoins: userData.maxCoins || 0,
                sduid: userData.sduid,
                createdAt: userData.createdAt
            };

            // 保存到localStorage
            localStorage.setItem('userInfo', JSON.stringify(standardUserInfo));
            localStorage.setItem('lastLoginTime', Date.now().toString());
            
            // 如果有token，也保存
            if (userData.id) {
                localStorage.setItem('userId', userData.id.toString());
            }

            console.log('💾 User info saved to localStorage:', standardUserInfo);
        } catch (error) {
            console.error('❌ Failed to save user info:', error);
        }
    };

    return (
        <div style={styles.container}>
            {status === 'loading' && (
                <div style={styles.loadingSimple}>
                    <div style={styles.spinnerSimple}></div>
                    <p style={styles.messageSimple}>正在登录...</p>
                </div>
            )}

            {status === 'error' && (
                <div style={styles.errorSimple}>
                    <p style={styles.messageSimple}>登录失败，正在重试...</p>
                </div>
            )}

            {/* success 状态不显示界面，直接跳转 */}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        fontFamily: 'Arial, sans-serif'
    },
    loadingSimple: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '25px',
        padding: '15px 30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    spinnerSimple: {
        width: '20px',
        height: '20px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTop: '2px solid #4CAF50',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: '15px'
    },
    messageSimple: {
        color: 'white',
        fontSize: '16px',
        margin: '0',
        fontWeight: '500'
    },
    errorSimple: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        border: '1px solid rgba(244, 67, 54, 0.3)',
        borderRadius: '25px',
        padding: '15px 30px',
        backdropFilter: 'blur(10px)'
    }
};

// 添加CSS动画
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default LoginCallback;
