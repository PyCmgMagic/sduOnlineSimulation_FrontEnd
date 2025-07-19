import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// Ant Design 主题配置
export const antdTheme = {
  token: {
    // 主色调 - 使用卡通风格的颜色
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // 圆角设置 - 更圆润的按钮和卡片
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    
    // 字体设置
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    
    // 阴影效果
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  components: {
    // 按钮样式
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    // 卡片样式
    Card: {
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    // 输入框样式
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    // 模态框样式
    Modal: {
      borderRadius: 12,
    },
  },
};

// Ant Design 配置提供者组件
export const AntdConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      {children}
    </ConfigProvider>
  );
}; 