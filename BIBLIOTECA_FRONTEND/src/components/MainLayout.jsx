import { Layout, Menu, Avatar, Typography, Button, theme } from 'antd';
import {
  BookOutlined, TeamOutlined, FileTextOutlined, HomeOutlined,
  LogoutOutlined, AppstoreOutlined, UserOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Sider, Content } = Layout;
const { Text } = Typography;

const ROL_COLOR = {
  Administrador: '#f5222d',
  Catalogador:   '#1677ff',
  Bibliotecario: '#fa8c16',
  Profesor:      '#722ed1',
  Lector:        '#52c41a',
};

export default function MainLayout() {
  const { user, permisos, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  function handleLogout() { logout(); navigate('/login'); }

  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: 'Inicio' },
    permisos.verLibros    && { key: '/libros',    icon: <BookOutlined />,     label: 'Libros' },
    permisos.verAutores   && { key: '/autores',   icon: <UserOutlined />,     label: 'Autores' },
    permisos.crearLibros  && { key: '/ejemplares',icon: <AppstoreOutlined />, label: 'Ejemplares' },
    permisos.verUsuarios  && { key: '/usuarios',  icon: <TeamOutlined />,     label: 'Usuarios' },
    permisos.verPrestamos && { key: '/prestamos', icon: <FileTextOutlined />, label: 'Préstamos' },
  ].filter(Boolean);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar style={{ backgroundColor: '#faad14', fontWeight: 700 }} size={36}>B</Avatar>
            <div>
              <Text strong style={{ color: '#fff', fontSize: 14, display: 'block' }}>Biblioteca</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Sistema de Gestión</Text>
            </div>
          </div>
        </div>

        {/* Nav */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, borderRight: 0, marginTop: 8 }}
        />

        {/* User footer */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar style={{ backgroundColor: ROL_COLOR[user?.rol] || '#1677ff' }} size={36}>
              {initials}
            </Avatar>
            <div style={{ overflow: 'hidden' }}>
              <Text strong style={{ color: '#fff', fontSize: 13, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nombre || 'Usuario'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{user?.rol}</Text>
            </div>
          </div>
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            block
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff' }}
          >
            Cerrar sesión
          </Button>
        </div>
      </Sider>

      <Layout>
        <Content style={{ background: '#f5f5f5', minHeight: '100vh' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
