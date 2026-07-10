import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import { BookOutlined, CheckCircleOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ libros: 0, usuarios: 0, prestamos: 0, disponibles: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [librosRes, usuariosRes, prestamosRes] = await Promise.allSettled([
          API.get('/libros'), API.get('/usuarios'), API.get('/prestamos'),
        ]);
        const getData = (res) => {
          if (res.status !== 'fulfilled') return [];
          const d = res.value.data;
          return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        };
        const librosData = getData(librosRes);
        const disponibles = librosData.reduce((sum, l) => sum + (parseInt(l.disponibles) || 0), 0);
        setStats({
          libros: librosData.length,
          usuarios: getData(usuariosRes).length,
          prestamos: getData(prestamosRes).length,
          disponibles,
        });
      } catch {}
    }
    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Libros',  value: stats.libros,     icon: <BookOutlined />,        color: '#1677ff' },
    { title: 'Disponibles',   value: stats.disponibles, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'Usuarios',      value: stats.usuarios,    icon: <TeamOutlined />,        color: '#fa8c16' },
    { title: 'Préstamos',     value: stats.prestamos,   icon: <FileTextOutlined />,    color: '#722ed1' },
  ];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Panel Principal</Title>
        <Text type="secondary">Bienvenido, {user?.nombre} · {user?.rol}</Text>
      </div>

      <Row gutter={[16, 16]}>
        {cards.map(c => (
          <Col xs={24} sm={12} lg={6} key={c.title}>
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title={c.title}
                value={c.value}
                prefix={<span style={{ color: c.color, fontSize: 22, marginRight: 6 }}>{c.icon}</span>}
                valueStyle={{ color: c.color, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 24, borderRadius: 12, textAlign: 'center', padding: '32px 0' }} bordered={false}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
        <Title level={4} style={{ margin: 0 }}>Sistema de Gestión Bibliotecaria</Title>
        <Text type="secondary">Usa la navegación lateral para gestionar libros, usuarios y préstamos.</Text>
      </Card>
    </div>
  );
}
