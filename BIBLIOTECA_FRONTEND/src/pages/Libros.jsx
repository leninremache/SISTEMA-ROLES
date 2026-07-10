import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, Typography, Popconfirm, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const EMPTY = { titulo: '', autor: '', isbn: '', genero: '', anio_publicacion: '', editorial: '', cantidad_total: 1 };

export default function Libros() {
  const { permisos } = useAuth();
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  async function fetchLibros() {
    setLoading(true);
    try {
      const res = await API.get('/libros');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setLibros(data);
    } catch { setLibros([]); } finally { setLoading(false); }
  }

  useEffect(() => { fetchLibros(); }, []);

  function openCreate() { setEditItem(null); form.setFieldsValue(EMPTY); setShowModal(true); }
  function openEdit(libro) { setEditItem(libro); form.setFieldsValue(libro); setShowModal(true); }

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editItem) await API.put(`/libros/${editItem.id}`, values);
      else await API.post('/libros', values);
      message.success(editItem ? 'Libro actualizado' : 'Libro agregado');
      setShowModal(false);
      fetchLibros();
    } catch (err) {
      message.error(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await API.delete(`/libros/${id}`);
      message.success('Libro eliminado');
      fetchLibros();
    } catch { message.error('Error al eliminar'); }
  }

  const filtered = libros.filter(l =>
    (l.titulo || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.autor || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.isbn || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { title: 'Título', dataIndex: 'titulo', key: 'titulo', render: t => <Text strong>{t}</Text> },
    { title: 'Autor', dataIndex: 'autor', key: 'autor' },
    { title: 'ISBN', dataIndex: 'isbn', key: 'isbn', render: v => <Text code>{v || '—'}</Text> },
    { title: 'Género', dataIndex: 'genero', key: 'genero', render: v => v ? <Tag color="blue">{v}</Tag> : '—' },
    { title: 'Año', dataIndex: 'anio_publicacion', key: 'anio_publicacion', render: v => v || '—' },
    {
      title: 'Disponible', key: 'disponible',
      render: (_, r) => parseInt(r.disponibles) > 0
        ? <Tag color="success">{r.disponibles} disponible{r.disponibles > 1 ? 's' : ''}</Tag>
        : <Tag color="error">No disponible</Tag>
    },
    {
      title: 'Acciones', key: 'acciones',
      render: (_, r) => (
        <Space>
          {permisos.editarLibros && <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Editar</Button>}
          {permisos.eliminarLibros && (
            <Popconfirm title="¿Eliminar este libro?" onConfirm={() => handleDelete(r.id)} okText="Sí" cancelText="No">
              <Button size="small" danger icon={<DeleteOutlined />}>Eliminar</Button>
            </Popconfirm>
          )}
          {!permisos.editarLibros && !permisos.eliminarLibros && <Text type="secondary">Solo lectura</Text>}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>📚 Libros</Title>
          <Text type="secondary">Gestión del catálogo bibliográfico</Text>
        </div>
        {permisos.crearLibros && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Agregar libro</Button>}
      </div>

      <Input.Search placeholder="Buscar por título, autor, ISBN..." value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16, maxWidth: 400 }} />

      <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading}
        pagination={{ pageSize: 10 }} style={{ background: '#fff', borderRadius: 12 }}
        locale={{ emptyText: <Empty description={search ? `No se encontraron libros para "${search}"` : 'No hay libros registrados'} /> }}
      />

      <Modal
        title={editItem ? 'Editar libro' : 'Agregar libro'}
        open={showModal} onOk={handleSave} onCancel={() => setShowModal(false)}
        okText={editItem ? 'Guardar cambios' : 'Agregar'} confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Título" name="titulo" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Autor" name="autor" rules={[{ required: true }]}><Input /></Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="ISBN" name="isbn"><Input placeholder="978-..." /></Form.Item>
            <Form.Item label="Género" name="genero"><Input placeholder="Ej. Ficción" /></Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="Año" name="anio_publicacion"><InputNumber style={{ width: '100%' }} /></Form.Item>
            <Form.Item label="Editorial" name="editorial"><Input /></Form.Item>
          </div>
          <Form.Item label="Cantidad total de ejemplares" name="cantidad_total">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
