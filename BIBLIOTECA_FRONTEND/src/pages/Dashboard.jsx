import { useState, useEffect } from 'react';
import API from '../services/api';
import '../App.css';

export default function Dashboard() {
  const [stats, setStats] = useState({ libros: 0, usuarios: 0, prestamos: 0, disponibles: 0 });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    async function fetchStats() {
      try {
        const [librosRes, usuariosRes, prestamosRes] = await Promise.allSettled([
          API.get('/libros'),
          API.get('/usuarios'),
          API.get('/prestamos'),
        ]);

        const getData = (res) => {
          if (res.status !== 'fulfilled') return [];
          const d = res.value.data;
          return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        };

        const librosData   = getData(librosRes);
        const usuariosData = getData(usuariosRes);
        const prestamosData = getData(prestamosRes);
        const disponibles  = librosData.reduce((sum, l) => sum + (parseInt(l.disponibles) || 0), 0);

        setStats({
          libros:    librosData.length,
          usuarios:  usuariosData.length,
          prestamos: prestamosData.length,
          disponibles,
        });
      } catch {
        // stats stay at 0
      }
    }
    fetchStats();
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Panel Principal</h1>
          <p>Bienvenido, {user.nombre || 'Usuario'} · {user.rol || ''}</p>
        </div>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">📚</div>
            <div>
              <div className="stat-value">{stats.libros}</div>
              <div className="stat-label">Total Libros</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div>
              <div className="stat-value">{stats.disponibles}</div>
              <div className="stat-label">Disponibles</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">👥</div>
            <div>
              <div className="stat-value">{stats.usuarios}</div>
              <div className="stat-label">Usuarios</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">📋</div>
            <div>
              <div className="stat-value">{stats.prestamos}</div>
              <div className="stat-label">Préstamos</div>
            </div>
          </div>
        </div>

        <div className="table-container" style={{ padding: '28px', textAlign: 'center', color: '#888' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>📖</p>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a5c', marginBottom: '6px' }}>
            Sistema de Gestión Bibliotecaria
          </p>
          <p style={{ fontSize: '13px' }}>
            Usa la navegación lateral para gestionar libros, usuarios y préstamos.
          </p>
        </div>
      </div>
    </>
  );
}
