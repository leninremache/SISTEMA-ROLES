import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const ESTADOS = ['Disponible', 'Prestado', 'En mantenimiento', 'Perdido', 'Dañado'];
const EMPTY_FORM = { id_libro: '', estado: 'Disponible', codigo: '' };

const ESTADO_BADGE = {
  Disponible: 'badge-green',
  Prestado: 'badge-blue',
  'En mantenimiento': 'badge-amber',
  Perdido: 'badge-red',
  Dañado: 'badge-red',
};

export default function Ejemplares() {
  const { permisos } = useAuth();
  const [ejemplares, setEjemplares] = useState([]);
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function fetchEjemplares() {
    setLoading(true);
    try {
      const res = await API.get('/ejemplares');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setEjemplares(data);
    } catch {
      setEjemplares([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLibros() {
    try {
      const res = await API.get('/libros');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setLibros(data);
    } catch {
      setLibros([]);
    }
  }

  useEffect(() => {
    fetchEjemplares();
    fetchLibros();
  }, []);

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(ej) {
    setEditItem(ej);
    setForm({ id_libro: ej.id_libro || '', estado: ej.estado || 'Disponible', codigo: ej.codigo || '' });
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
    if (!form.id_libro) { setError('Selecciona un libro.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editItem) {
        await API.put(`/ejemplares/${editItem.id}`, form);
      } else {
        await API.post('/ejemplares', form);
      }
      closeModal();
      fetchEjemplares();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ej) {
    if (!window.confirm(`¿Eliminar ejemplar #${ej.id}?`)) return;
    try {
      await API.delete(`/ejemplares/${ej.id}`);
      fetchEjemplares();
    } catch {
      alert('Error al eliminar el ejemplar.');
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📖 Ejemplares</h1>
          <p>Gestión de ejemplares físicos del catálogo</p>
        </div>
        {permisos.crearLibros && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Agregar ejemplar
          </button>
        )}
      </div>

      <div className="page-body">
        <div className="table-container">
          <div className="table-toolbar">
            <h2>Ejemplares ({ejemplares.length})</h2>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Código</th>
                  <th>Libro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ejemplares.length === 0 ? (
                  <tr><td colSpan={5} className="table-empty">No hay ejemplares registrados.</td></tr>
                ) : (
                  ejemplares.map((ej, i) => (
                    <tr key={ej.id || i}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#1a3a5c' }}>#{ej.id}</td>
                      <td>{ej.codigo || '—'}</td>
                      <td style={{ fontWeight: '600' }}>{ej.libro_titulo || `Libro #${ej.id_libro}`}</td>
                      <td>
                        <span className={`badge ${ESTADO_BADGE[ej.estado] || 'badge-gray'}`}>
                          {ej.estado}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {permisos.editarLibros && (
                            <button className="btn-edit" onClick={() => openEdit(ej)}>✏️ Editar</button>
                          )}
                          {permisos.eliminarLibros && (
                            <button className="btn-delete" onClick={() => handleDelete(ej)}>🗑️ Eliminar</button>
                          )}
                          {!permisos.editarLibros && !permisos.eliminarLibros && (
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
              <h3>{editItem ? 'Editar ejemplar' : 'Agregar ejemplar'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Libro *</label>
                <select name="id_libro" value={form.id_libro} onChange={handleChange}>
                  <option value="">— Seleccionar libro —</option>
                  {libros.map(l => (
                    <option key={l.id} value={l.id}>{l.titulo}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange}>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Código del ejemplar</label>
                <input name="codigo" value={form.codigo} onChange={handleChange} placeholder="Ej. EJ-001" />
              </div>
              {error && <div className="error-msg">{error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editItem ? 'Guardar cambios' : 'Agregar ejemplar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
