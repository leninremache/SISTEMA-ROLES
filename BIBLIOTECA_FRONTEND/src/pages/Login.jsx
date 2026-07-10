import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values) {
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/usuarios/login', { email: values.email, password: values.password });
      const data = res.data;
      const token = data.token || 'demo-token';
      const user = data.usuario || { nombre: values.email.split('@')[0], rol: values.rol };
      login({ ...user, rol: user.rol || values.rol }, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a3a5c 0%, #0f2035 100%)',
    }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14, background: '#1a3a5c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 26, fontWeight: 700, color: '#faad14',
          }}>B</div>
          <Title level={3} style={{ margin: 0 }}>Biblioteca Digital</Title>
          <Text type="secondary">Sistema de Gestión Bibliotecaria</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={handleSubmit} initialValues={{ rol: 'Administrador' }}>
          <Form.Item label="Correo electrónico" name="email" rules={[{ required: true, message: 'Ingresa tu email' }]}>
            <Input prefix={<UserOutlined />} placeholder="usuario@biblioteca.com" size="large" />
          </Form.Item>

          <Form.Item label="Contraseña" name="password" rules={[{ required: true, message: 'Ingresa tu contraseña' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>

          <Form.Item label="Rol" name="rol">
            <Select size="large">
              <Select.Option value="Administrador">Administrador</Select.Option>
              <Select.Option value="Catalogador">Catalogador</Select.Option>
              <Select.Option value="Bibliotecario">Bibliotecario</Select.Option>
              <Select.Option value="Lector">Lector</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}
              style={{ background: '#1a3a5c', borderColor: '#1a3a5c', height: 46 }}>
              Iniciar sesión
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
