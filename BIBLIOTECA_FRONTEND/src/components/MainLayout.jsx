import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

export default function MainLayout() {
  const { user, permisos, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">B</div>
          <div>
            <div className="logo-text">Biblioteca</div>
            <div className="logo-subtitle">Sistema de Gestión</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navegación</div>
          <NavLink to="/" end>
            <span className="nav-icon">🏠</span> Inicio
          </NavLink>
          {permisos.verLibros && (
            <NavLink to="/libros">
              <span className="nav-icon">📚</span> Libros
            </NavLink>
          )}
          {permisos.verUsuarios && (
            <NavLink to="/usuarios">
              <span className="nav-icon">👥</span> Usuarios
            </NavLink>
          )}
          {permisos.verPrestamos && (
            <NavLink to="/prestamos">
              <span className="nav-icon">📋</span> Préstamos
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.nombre || 'Usuario'}</div>
              <div className="user-role">{user?.rol || 'Rol'}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
