import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const ESTADO_BADGE = {
  activo:   'badge-blue',
  devuelto: 'badge-green',
  vencido:  'badge-red',
  renovado: 'badge-amber',
  pendiente:'badge-amber',
};

const EMPTY_FORM = {
  usuario_id: '',
  ejemplar_id: '',
  fecha_devolucion_esperada: '',
};

export default function Prestamos() {
  const { permisos } = useAuth();
  const [prestamos, setPrestamos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [usuarios, setUsuarios] = useState([]);

  async function fetchPrestamos() {
    setLoading(true);
    try {
      const res = await API.get('/prestamos');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : (res.data.prestamos || []);
      setPrestamos(data);
      setFiltered(data);
    } catch {
      setPrestamos([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsuarios() {
    try {
      const res = await API.get('/usuarios');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : (res.data.usuarios || []);
      setUsuarios(data);
    } catch {
      setUsuarios([]);
    }
  }

  useEffect(() => {
    fetchPrestamos();
    fetchUsuarios();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      prestamos.filter(p =>
        String(p.id || '').includes(q) ||
        (p.estado || '').toLowerCase().includes(q) ||
        (p.usuario?.nombre || p.nombre_usuario || '').toLowerCase().includes(q) ||
        (p.ejemplar_id || p.libro_titulo || '').toString().toLowerCase().includes(q)
      )
    );
  }, [search, prestamos]);

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(prestamo) {
    setEditItem(prestamo);
    setForm({
      usuario_id: prestamo.id_usuario || '',
      ejemplar_id: prestamo.id_ejemplar || '',
      fecha_devolucion_esperada: prestamo.fecha_devolucion
        ? prestamo.fecha_devolucion.slice(0, 10)
        : '',
    });
    setError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditItem(null);
    setError('');
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.usuario_id || !form.ejemplar_id) {
      setError('Usuario y ejemplar son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editItem) {
        await API.put(`/prestamos/${editItem.id}`, form);
      } else {
        await API.post('/prestamos', form);
      }
      closeModal();
      fetchPrestamos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el préstamo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDevolver(prestamo) {
    if (!window.confirm(`¿Registrar devolución del préstamo #${prestamo.id}?`)) return;
    try {
      await API.put(`/prestamos/${prestamo.id}`, { estado: 'Devuelto', fecha_devolucion: new Date().toISOString().slice(0, 10) });
      fetchPrestamos();
    } catch {
      alert('Error al registrar la devolución.');
    }
  }

  async function handleDelete(prestamo) {
    if (!window.confirm(`¿Eliminar el préstamo #${prestamo.id}?`)) return;
    try {
      await API.delete(`/prestamos/${prestamo.id}`);
      fetchPrestamos();
    } catch {
      alert('Error al eliminar el préstamo.');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  function estadoBadge(estado) {
    const key = (estado || '').toLowerCase();
    return (
      <span className={`badge ${ESTADO_BADGE[key] || 'badge-gray'}`}>
        {estado || '—'}
      </span>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📋 Préstamos</h1>
          <p>Registro y control de préstamos de libros</p>
        </div>
        {permisos.crearPrestamos && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Nuevo préstamo
          </button>
        )}
      </div>

      <div className="page-body">
        <div className="table-container">
          <div className="table-toolbar">
            <h2>Préstamos ({filtered.length})</h2>
            <div className="toolbar-actions">
              <input
                className="search-input"
                placeholder="Buscar por ID, usuario, estado..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Ejemplar</th>
                  <th>Fecha Salida</th>
                  <th>Fecha Devolución</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty">
                      {search ? 'No se encontraron resultados.' : 'No hay préstamos registrados.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr key={p.id || i}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#1a3a5c' }}>
                        #{p.id}
                      </td>
      <td>{p.nombre_usuario || `ID ${p.id_usuario}` || '—'}</td>
                      <td>
                        {p.libro_titulo
                          ? <span>{p.libro_titulo} <span style={{color:'#aaa',fontSize:'11px'}}>({p.codigo_ejemplar || `#${p.id_ejemplar}`})</span></span>
                          : <span style={{ color: '#aaa' }}>Ejemplar #{p.id_ejemplar}</span>
                        }
                      </td>
                      <td>{formatDate(p.fecha_prestamo || p.fecha_salida)}</td>
                      <td>{formatDate(p.fecha_devolucion || p.fecha_devolucion_esperada)}</td>
                      <td>{estadoBadge(p.estado)}</td>
                      <td>
                        <div className="action-buttons">
                          {permisos.editarPrestamos && p.estado !== 'Devuelto' && (
                            <button className="btn-edit" onClick={() => handleDevolver(p)}>↩ Devolver</button>
                          )}
                          {permisos.editarPrestamos && (
                            <button className="btn-edit" onClick={() => openEdit(p)}>✏️ Editar</button>
                          )}
                          {permisos.eliminarPrestamos && (
                            <button className="btn-delete" onClick={() => handleDelete(p)}>🗑️</button>
                          )}
                          {!permisos.editarPrestamos && !permisos.eliminarPrestamos && (
                            <span style={{ color: '#aaa', fontSize: '12px' }}>Solo lectura</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editItem ? 'Editar préstamo' : 'Nuevo préstamo'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Usuario *</label>
                {usuarios.length > 0 ? (
                  <select name="usuario_id" value={form.usuario_id} onChange={handleChange}>
                    <option value="">— Seleccionar usuario —</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="usuario_id"
                    type="number"
                    value={form.usuario_id}
                    onChange={handleChange}
                    placeholder="ID del usuario"
                  />
                )}
              </div>
              <div className="form-group">
                <label>ID del Ejemplar *</label>
                <input
                  name="ejemplar_id"
                  type="number"
                  value={form.ejemplar_id}
                  onChange={handleChange}
                  placeholder="ID del ejemplar"
                />
              </div>
              <div className="form-group">
                <label>Fecha de devolución esperada</label>
                <input
                  name="fecha_devolucion_esperada"
                  type="date"
                  value={form.fecha_devolucion_esperada}
                  onChange={handleChange}
                />
              </div>

              {error && <div className="error-msg">{error}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editItem ? 'Guardar cambios' : 'Crear préstamo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
