import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, DatePicker, Space,
  Typography, Popconfirm, message, Empty, Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const EMPTY = { nombre: '', fecha_nacimiento: null, nacionalidad: '', biografia: '' };

export default function Autores() {
  const { permisos } = useAuth();
  const [autores, setAutores]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [form]                    = Form.useForm();

  async function fetchAutores() {
    setLoading(true);
    try {
      const res  = await API.get('/autores');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAutores(data);
    } catch { setAutores([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAutores(); }, []);

  function openCreate() {
    setEditItem(null);
    form.setFieldsValue(EMPTY);
    setShowModal(true);
  }

  function openEdit(autor) {
    setEditItem(autor);
    form.setFieldsValue({
      ...autor,
      fecha_nacimiento: autor.fecha_nacimiento ? dayjs(autor.fecha_nacimiento) : null,
    });
    setShowModal(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    const payload = {
      ...values,
      fecha_nacimiento: values.fecha_nacimiento
        ? values.fecha_nacimiento.format('YYYY-MM-DD')
        : null,
    };
    setSaving(true);
    try {
      if (editItem) await API.put(`/autores/${editItem.id}`, payload);
      else          await API.post('/autores', payload);
      message.success(editItem ? 'Autor actualizado' : 'Autor agregado');
      setShowModal(false);
      fetchAutores();
    } catch (err) {
      message.error(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await API.delete(`/autores/${id}`);
      message.success('Autor eliminado');
      fetchAutores();
    } catch { message.error('Error al eliminar'); }
  }

  const filtered = autores.filter(a =>
    (a.nombre       || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.nacionalidad || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Nombre', dataIndex: 'nombre', key: 'nombre',
      render: t => <Text strong>{t}</Text>,
    },
    {
      title: 'Fecha de nacimiento', dataIndex: 'fecha_nacimiento', key: 'fecha_nacimiento',
      render: v => v ? dayjs(v).format('DD/MM/YYYY') : <Text type="secondary">—</Text>,
    },
    {
      title: 'Nacionalidad', dataIndex: 'nacionalidad', key: 'nacionalidad',
      render: v => v ? <Tag color="geekblue">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Biografía', dataIndex: 'biografia', key: 'biografia',
      ellipsis: true,
      render: v => v ? <Text type="secondary">{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Acciones', key: 'acciones',
      render: (_, r) => (
        <Space>
          {permisos.editarAutores && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
              Editar
            </Button>
          )}
          {permisos.eliminarAutores && (
            <Popconfirm
              title="¿Eliminar este autor?"
              onConfirm={() => handleDelete(r.id)}
              okText="Sí" cancelText="No"
            >
              <Button size="small" danger icon={<DeleteOutlined />}>Eliminar</Button>
            </Popconfirm>
          )}
          {!permisos.editarAutores && !permisos.eliminarAutores && (
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
          <Title level={3} style={{ margin: 0 }}>✍️ Autores</Title>
          <Text type="secondary">Gestión de autores del catálogo</Text>
        </div>
        {permisos.crearAutores && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Agregar autor
          </Button>
        )}
      </div>

      <Input.Search
        placeholder="Buscar por nombre o nacionalidad..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 400 }}
      />

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        style={{ background: '#fff', borderRadius: 12 }}
        locale={{
          emptyText: (
            <Empty description={search ? `No se encontraron autores para "${search}"` : 'No hay autores registrados'} />
          ),
        }}
      />

      <Modal
        title={editItem ? 'Editar autor' : 'Agregar autor'}
        open={showModal}
        onOk={handleSave}
        onCancel={() => setShowModal(false)}
        okText={editItem ? 'Guardar cambios' : 'Agregar'}
        confirmLoading={saving}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Nombre" name="nombre" rules={[{ required: true, message: 'El nombre es obligatorio' }]}>
            <Input placeholder="Nombre completo del autor" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="Fecha de nacimiento" name="fecha_nacimiento">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Seleccionar fecha" />
            </Form.Item>
            <Form.Item label="Nacionalidad" name="nacionalidad">
              <Input placeholder="Ej. Colombiana" />
            </Form.Item>
          </div>
          <Form.Item label="Biografía" name="biografia">
            <TextArea rows={4} placeholder="Breve descripción del autor..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
