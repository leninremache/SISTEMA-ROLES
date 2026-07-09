import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const ROLES = ['Administrador', 'Catalogador', 'Bibliotecario', 'Lector'];

const EMPTY_FORM = { nombre: '', email: '', password: '', rol: 'Lector', telefono: '' };

const ROL_BADGE = {
  Administrador: 'badge-red',
  Catalogador: 'badge-blue',
  Bibliotecario: 'badge-amber',
  Lector: 'badge-green',
};

export default function Usuarios() {
  const { permisos } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function fetchUsuarios() {
    setLoading(true);
    try {
      const res = await API.get('/usuarios');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : (res.data.usuarios || []);
      setUsuarios(data);
      setFiltered(data);
    } catch {
      setUsuarios([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsuarios(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      usuarios.filter(u =>
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.rol || '').toLowerCase().includes(q)
      )
    );
  }, [search, usuarios]);

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(usuario) {
    setEditItem(usuario);
    setForm({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '',
      rol: usuario.rol || 'Lector',
      telefono: usuario.telefono || '',
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
    if (!form.nombre || !form.email) {
      setError('Nombre y email son obligatorios.');
      return;
    }
    if (!editItem && !form.password) {
      setError('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (editItem && !payload.password) delete payload.password;
      if (editItem) {
        await API.put(`/usuarios/${editItem.id}`, payload);
      } else {
        await API.post('/usuarios', payload);
      }
      closeModal();
      fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el usuario.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(usuario) {
    if (!window.confirm(`¿Eliminar al usuario "${usuario.nombre}"?`)) return;
    try {
      await API.delete(`/usuarios/${usuario.id}`);
      fetchUsuarios();
    } catch {
      alert('Error al eliminar el usuario.');
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>👥 Usuarios</h1>
          <p>Gestión de usuarios del sistema</p>
        </div>
        {permisos.crearUsuarios && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Agregar usuario
          </button>
        )}
      </div>

      <div className="page-body">
        <div className="table-container">
          <div className="table-toolbar">
            <h2>Usuarios ({filtered.length})</h2>
            <div className="toolbar-actions">
              <input
                className="search-input"
                placeholder="Buscar por nombre, email, rol..."
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
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Teléfono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      {search ? 'No se encontraron resultados.' : 'No hay usuarios registrados.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, i) => (
                    <tr key={u.id || i}>
                      <td style={{ color: '#aaa', fontSize: '12px' }}>{i + 1}</td>
                      <td style={{ fontWeight: '600', color: '#1a3a5c' }}>{u.nombre || '—'}</td>
                      <td style={{ fontSize: '13px' }}>{u.email || '—'}</td>
                      <td>
                        <span className={`badge ${ROL_BADGE[u.rol] || 'badge-gray'}`}>
                          {u.rol || '—'}
                        </span>
                      </td>
                      <td>{u.telefono || '—'}</td>
                      <td>
                        <div className="action-buttons">
                          {permisos.editarUsuarios && (
                            <button className="btn-edit" onClick={() => openEdit(u)}>✏️ Editar</button>
                          )}
                          {permisos.eliminarUsuarios && (
                            <button className="btn-delete" onClick={() => handleDelete(u)}>🗑️ Eliminar</button>
                          )}
                          {!permisos.editarUsuarios && !permisos.eliminarUsuarios && (
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
              <h3>{editItem ? 'Editar usuario' : 'Agregar usuario'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre completo *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre del usuario" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
              </div>
              <div className="form-group">
                <label>Contraseña {editItem ? '(dejar vacío para no cambiar)' : '*'}</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Rol</label>
                  <select name="rol" value={form.rol} onChange={handleChange}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+52 000 000 0000" />
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editItem ? 'Guardar cambios' : 'Agregar usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
