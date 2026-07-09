import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const EMPTY_FORM = {
  titulo: '', autor: '', isbn: '', genero: '',
  anio_publicacion: '', editorial: '', cantidad_total: 1,
};

export default function Libros() {
  const { permisos } = useAuth();
  const [libros, setLibros] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function fetchLibros() {
    setLoading(true);
    try {
      const res = await API.get('/libros');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : (res.data.libros || []);
      setLibros(data);
      setFiltered(data);
    } catch {
      setLibros([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLibros(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      libros.filter(l =>
        (l.titulo || '').toLowerCase().includes(q) ||
        (l.autor || '').toLowerCase().includes(q) ||
        (l.isbn || '').toLowerCase().includes(q) ||
        (l.genero || '').toLowerCase().includes(q)
      )
    );
  }, [search, libros]);

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(libro) {
    setEditItem(libro);
    setForm({
      titulo: libro.titulo || '',
      autor: libro.autor || '',
      isbn: libro.isbn || '',
      genero: libro.genero || '',
      anio_publicacion: libro.anio_publicacion || '',
      editorial: libro.editorial || '',
      cantidad_total: libro.cantidad_total || 1,
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
    if (!form.titulo || !form.autor) {
      setError('Título y autor son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editItem) {
        await API.put(`/libros/${editItem.id}`, form);
      } else {
        await API.post('/libros', form);
      }
      closeModal();
      fetchLibros();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el libro.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(libro) {
    if (!window.confirm(`¿Eliminar "${libro.titulo}"?`)) return;
    try {
      await API.delete(`/libros/${libro.id}`);
      fetchLibros();
    } catch {
      alert('Error al eliminar el libro.');
    }
  }

  function disponibilidadBadge(libro) {
    const disp = parseInt(libro.disponibles ?? libro.disponible ?? libro.disponibilidad ?? libro.cantidad_disponible);
    if (!isNaN(disp) && disp > 0) {
      return <span className="badge badge-green">{disp} disponible{disp > 1 ? 's' : ''}</span>;
    }
    return <span className="badge badge-red">No disponible</span>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📚 Libros</h1>
          <p>Gestión del catálogo bibliográfico</p>
        </div>
        {permisos.crearLibros && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Agregar libro
          </button>
        )}
      </div>

      <div className="page-body">
        <div className="table-container">
          <div className="table-toolbar">
            <h2>Catálogo ({filtered.length})</h2>
            <div className="toolbar-actions">
              <input
                className="search-input"
                placeholder="Buscar por título, autor, ISBN..."
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
                  <th>Título</th>
                  <th>Autor</th>
                  <th>ISBN</th>
                  <th>Género</th>
                  <th>Año</th>
                  <th>Disponible</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-empty">
                      {search ? 'No se encontraron resultados.' : 'No hay libros registrados.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((libro, i) => (
                    <tr key={libro.id || i}>
                      <td style={{ color: '#aaa', fontSize: '12px' }}>{i + 1}</td>
                      <td style={{ fontWeight: '600', color: '#1a3a5c' }}>{libro.titulo || '—'}</td>
                      <td>{libro.autor || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12.5px' }}>{libro.isbn || '—'}</td>
                      <td>{libro.genero ? <span className="badge badge-blue">{libro.genero}</span> : '—'}</td>
                      <td>{libro.anio_publicacion || libro.año || '—'}</td>
                      <td>{disponibilidadBadge(libro)}</td>
                      <td>
                        <div className="action-buttons">
                          {permisos.editarLibros && (
                            <button className="btn-edit" onClick={() => openEdit(libro)}>✏️ Editar</button>
                          )}
                          {permisos.eliminarLibros && (
                            <button className="btn-delete" onClick={() => handleDelete(libro)}>🗑️ Eliminar</button>
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
              <h3>{editItem ? 'Editar libro' : 'Agregar libro'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Título *</label>
                <input name="titulo" value={form.titulo} onChange={handleChange} placeholder="Título del libro" />
              </div>
              <div className="form-group">
                <label>Autor *</label>
                <input name="autor" value={form.autor} onChange={handleChange} placeholder="Nombre del autor" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>ISBN</label>
                  <input name="isbn" value={form.isbn} onChange={handleChange} placeholder="978-..." />
                </div>
                <div className="form-group">
                  <label>Género</label>
                  <input name="genero" value={form.genero} onChange={handleChange} placeholder="Ej. Ficción" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Año de publicación</label>
                  <input name="anio_publicacion" type="number" value={form.anio_publicacion} onChange={handleChange} placeholder="2024" />
                </div>
                <div className="form-group">
                  <label>Editorial</label>
                  <input name="editorial" value={form.editorial} onChange={handleChange} placeholder="Editorial" />
                </div>
              </div>
              <div className="form-group">
                <label>Cantidad total de ejemplares</label>
                <input name="cantidad_total" type="number" min="1" value={form.cantidad_total} onChange={handleChange} />
              </div>

              {error && <div className="error-msg">{error}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editItem ? 'Guardar cambios' : 'Agregar libro')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
