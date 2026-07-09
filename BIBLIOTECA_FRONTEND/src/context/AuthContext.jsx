import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// ── Permisos por rol ──────────────────────────────────────────────────────────
const PERMISOS = {
  Administrador: {
    verLibros: true, crearLibros: true, editarLibros: true, eliminarLibros: true,
    verUsuarios: true, crearUsuarios: true, editarUsuarios: true, eliminarUsuarios: true,
    verPrestamos: true, crearPrestamos: true, editarPrestamos: true, eliminarPrestamos: true,
  },
  Catalogador: {
    verLibros: true, crearLibros: true, editarLibros: true, eliminarLibros: true,
    verUsuarios: false, crearUsuarios: false, editarUsuarios: false, eliminarUsuarios: false,
    verPrestamos: true, crearPrestamos: false, editarPrestamos: false, eliminarPrestamos: false,
  },
  Bibliotecario: {
    verLibros: true, crearLibros: false, editarLibros: false, eliminarLibros: false,
    verUsuarios: true, crearUsuarios: true, editarUsuarios: true, eliminarUsuarios: false,
    verPrestamos: true, crearPrestamos: true, editarPrestamos: true, eliminarPrestamos: true,
  },
  Lector: {
    verLibros: true, crearLibros: false, editarLibros: false, eliminarLibros: false,
    verUsuarios: false, crearUsuarios: false, editarUsuarios: false, eliminarUsuarios: false,
    verPrestamos: false, crearPrestamos: false, editarPrestamos: false, eliminarPrestamos: false,
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  const permisos = PERMISOS[user?.rol] || PERMISOS.Lector;

  function login(userData, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, permisos, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
