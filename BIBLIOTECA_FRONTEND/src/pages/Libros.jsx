import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Select,
  Tag, Space, Typography, Popconfirm, message, Empty,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const EMPTY = {
  titulo: '', autor_id: null, autor: '', isbn: '', genero: '',
  anio_publicacion: null, editorial: '', edicion: '',
  numero_paginas: null, idioma: 'Español', clasificacion_dewey: '',
  descripcion: '', cantidad_total: 1,
};

export default function Libros() {
  const { permisos }              = useAuth();
  const [libros, setLibros]       = useState([]);
  const [autores, setAutores]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [form]                    = Form.useForm();

  async function fetchLibros() {
    setLoading(true);
    try {
      const res  = await API.get('/libros');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setLibros(data);
    } catch { setLibros([]); }
    finally { setLoading(false); }
  }

  async function fetchAutores() {
    try {
      const res  = await API.get('/autores');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAutores(data);
    } catch { setAutores([]); }
  }

  useEffect(() => { fetchLibros(); fetchAutores(); }, []);

  function openCreate() {
    setEditItem(null);
    form.setFieldsValue(EMPTY);
    setShowModal(true);
  }

  function openEdit(libro) {
    setEditItem(libro);
    form.setFieldsValue({
      ...EMPTY,
      ...libro,
      autor_id: libro.autor_id ?? null,
    });
    setShowModal(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editItem) await API.put(`/libros/${editItem.id}`, values);
      else          await API.post('/libros', values);
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

  const filtered = libros.filter(l => {
    if (!search) return true;
    // Buscar cada palabra por separado
    const palabras = search.toLowerCase().split(' ').filter(p => p.length > 0);
    const texto = [
      l.titulo, l.autor, l.isbn, l.genero, l.editorial,
      l.idioma, l.clasificacion_dewey, l.edicion,
      String(l.anio_publicacion || ''), l.descripcion
    ].join(' ').toLowerCase();
    return palabras.every(palabra => texto.includes(palabra));
  });

  const columns = [
    {
      title: 'Título', dataIndex: 'titulo', key: 'titulo',
      render: t => <Text strong>{t}</Text>,
    },
    { title: 'Autor', dataIndex: 'autor', key: 'autor', render: v => v || <Text type="secondary">—</Text> },
    { title: 'ISBN',  dataIndex: 'isbn',  key: 'isbn',  render: v => <Text code>{v || '—'}</Text> },
    {
      title: 'Género', dataIndex: 'genero', key: 'genero',
      render: v => v ? <Tag color="blue">{v}</Tag> : '—',
    },
    { title: 'Año',      dataIndex: 'anio_publicacion', key: 'anio_publicacion', render: v => v || '—' },
    { title: 'Editorial', dataIndex: 'editorial', key: 'editorial', render: v => v || <Text type="secondary">—</Text> },
    { title: 'Idioma',   dataIndex: 'idioma',    key: 'idioma',    render: v => v || <Text type="secondary">—</Text> },
    {
      title: 'Disponible', key: 'disponible',
      render: (_, r) => parseInt(r.disponibles) > 0
        ? <Tag color="success">{r.disponibles} disponible{r.disponibles > 1 ? 's' : ''}</Tag>
        : <Tag color="error">No disponible</Tag>,
    },
    {
      title: 'Acciones', key: 'acciones',
      render: (_, r) => (
        <Space>
          {permisos.editarLibros && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Editar</Button>
          )}
          {permisos.eliminarLibros && (
            <Popconfirm title="¿Eliminar este libro?" onConfirm={() => handleDelete(r.id)} okText="Sí" cancelText="No">
              <Button size="small" danger icon={<DeleteOutlined />}>Eliminar</Button>
            </Popconfirm>
          )}
          {!permisos.editarLibros && !permisos.eliminarLibros && (
            <Text type="secondary">Solo lectura</Text>
          )}
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
        {permisos.crearLibros && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Agregar libro</Button>
        )}
      </div>

      <Input.Search
        placeholder="Buscar por título, autor, ISBN, género, editorial, año, idioma, Dewey..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 600 }}
        allowClear
      />

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 900 }}
        style={{ background: '#fff', borderRadius: 12 }}
        locale={{
          emptyText: (
            <Empty description={search ? `No se encontraron libros para "${search}"` : 'No hay libros registrados'} />
          ),
        }}
      />

      <Modal
        title={editItem ? 'Editar libro' : 'Agregar libro'}
        open={showModal}
        onOk={handleSave}
        onCancel={() => setShowModal(false)}
        okText={editItem ? 'Guardar cambios' : 'Agregar'}
        confirmLoading={saving}
        width={680}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Título" name="titulo" rules={[{ required: true, message: 'El título es obligatorio' }]}>
            <Input />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="Autor (catálogo)" name="autor_id">
              <Select
                allowClear
                showSearch
                placeholder="Seleccionar autor registrado"
                optionFilterProp="children"
              >
                {autores.map(a => (
                  <Select.Option key={a.id} value={a.id}>{a.nombre}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Autor (texto libre)" name="autor">
              <Input placeholder="Nombre del autor (opcional)" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="ISBN" name="isbn">
              <Input placeholder="978-..." />
            </Form.Item>
            <Form.Item label="Género / Categoría" name="genero">
              <Input placeholder="Ej. Ficción, Historia..." />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item label="Año de publicación" name="anio_publicacion">
              <InputNumber style={{ width: '100%' }} min={1} max={new Date().getFullYear()} />
            </Form.Item>
            <Form.Item label="Editorial" name="editorial">
              <Input />
            </Form.Item>
            <Form.Item label="Edición" name="edicion">
              <Input placeholder="Ej. 3ª edición" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item label="Número de páginas" name="numero_paginas">
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item label="Idioma" name="idioma">
              <Select>
                <Select.Option value="Español">Español</Select.Option>
                <Select.Option value="Inglés">Inglés</Select.Option>
                <Select.Option value="Francés">Francés</Select.Option>
                <Select.Option value="Alemán">Alemán</Select.Option>
                <Select.Option value="Portugués">Portugués</Select.Option>
                <Select.Option value="Otro">Otro</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Clasificación Dewey" name="clasificacion_dewey">
              <Input placeholder="Ej. 823.914" />
            </Form.Item>
          </div>

          <Form.Item label="Cantidad total de ejemplares" name="cantidad_total">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Descripción / Sinopsis" name="descripcion">
            <TextArea rows={3} placeholder="Breve descripción del libro..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
