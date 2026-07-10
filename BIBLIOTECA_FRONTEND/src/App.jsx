import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Libros from './pages/Libros';
import Autores from './pages/Autores';
import Usuarios from './pages/Usuarios';
import Prestamos from './pages/Prestamos';
import Ejemplares from './pages/Ejemplares';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="libros" element={<Libros />} />
          <Route path="autores" element={<Autores />} />
          <Route path="ejemplares" element={<Ejemplares />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="prestamos" element={<Prestamos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
