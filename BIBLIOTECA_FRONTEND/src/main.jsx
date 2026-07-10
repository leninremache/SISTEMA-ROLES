import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={esES} theme={{
      token: { colorPrimary: '#1a3a5c', borderRadius: 8 }
    }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  </StrictMode>,
)
