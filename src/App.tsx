import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AntdConfigProvider } from './antd-config';
import GamePage from './components/GamePage';
import LoginCallback from './components/LoginCallback';
import 'antd/dist/reset.css';

function App() {
    const handleLoginSuccess = (userInfo: any) => {
        console.log('🎉 Login success in App:', userInfo);
    };

    return (
        <AntdConfigProvider>
            <Router>
                <div id="app">
                    <Routes>
                        {/* 主游戏页面 */}
                        <Route
                            path="/"
                            element={<GamePage />}
                        />

                        {/* 三方登录回调页面 */}
                        <Route
                            path="/login/callback"
                            element={
                                <LoginCallback
                                    onLoginSuccess={handleLoginSuccess}
                                />
                            }
                        />

                        {/* 登录成功后的游戏页面（跳过动画） */}
                        <Route
                            path="/game"
                            element={<GamePage skipBootAnimation={true} />}
                        />
                    </Routes>
                </div>
            </Router>
        </AntdConfigProvider>
    )
}

export default App
