import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const ESTADOS = ['Disponible', 'Prestado', 'En mantenimiento', 'Perdido', 'Dañado'];
const ESTADO_COLOR = { Disponible: 'green', Prestado: 'blue', 'En mantenimiento': 'orange', Perdido: 'red', Dañado: 'red' };

export default function Ejemplares() {
  const { permisos } = useAuth();
  const [ejemplares, setEjemplares] = useState([]);
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  async function fetchEjemplares() {
    setLoading(true);
    try {
      const res = await API.get('/ejemplares');
      setEjemplares(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setEjemplares([]); } finally { setLoading(false); }
  }

  async function fetchLibros() {
    try {
      const res = await API.get('/libros');
      setLibros(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setLibros([]); }
  }

  useEffect(() => { fetchEjemplares(); fetchLibros(); }, []);

  function openCreate() { setEditItem(null); form.resetFields(); form.setFieldValue('estado', 'Disponible'); setShowModal(true); }
  function openEdit(ej) { setEditItem(ej); form.setFieldsValue(ej); setShowModal(true); }

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editItem) await API.put(`/ejemplares/${editItem.id}`, values);
      else await API.post('/ejemplares', values);
      message.success(editItem ? 'Ejemplar actualizado' : 'Ejemplar agregado');
      setShowModal(false);
      fetchEjemplares();
    } catch (err) {
      message.error(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await API.delete(`/ejemplares/${id}`);
      message.success('Ejemplar eliminado');
      fetchEjemplares();
    } catch { message.error('Error al eliminar'); }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: v => <Text strong>#{v}</Text>, width: 70 },
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', render: v => v ? <Text code>{v}</Text> : '—' },
    { title: 'Libro', dataIndex: 'libro_titulo', key: 'libro', render: (v, r) => v || `Libro #${r.id_libro}` },
    { title: 'Estado', dataIndex: 'estado', key: 'estado', render: v => <Tag color={ESTADO_COLOR[v] || 'default'}>{v}</Tag> },
    {
      title: 'Acciones', key: 'acciones',
      render: (_, r) => (
        <Space>
          {permisos.editarLibros && <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Editar</Button>}
          {permisos.eliminarLibros && (
            <Popconfirm title={`¿Eliminar ejemplar #${r.id}?`} onConfirm={() => handleDelete(r.id)} okText="Sí" cancelText="No">
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
          <Title level={3} style={{ margin: 0 }}>📖 Ejemplares</Title>
          <Text type="secondary">Gestión de ejemplares físicos del catálogo</Text>
        </div>
        {permisos.crearLibros && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Agregar ejemplar</Button>}
      </div>

      <Table dataSource={ejemplares} columns={columns} rowKey="id" loading={loading}
        pagination={{ pageSize: 10 }} style={{ background: '#fff', borderRadius: 12 }} />

      <Modal title={editItem ? 'Editar ejemplar' : 'Agregar ejemplar'}
        open={showModal} onOk={handleSave} onCancel={() => setShowModal(false)}
        okText={editItem ? 'Guardar' : 'Agregar'} confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Libro" name="id_libro" rules={[{ required: true }]}>
            <Select placeholder="Seleccionar libro">
              {libros.map(l => <Select.Option key={l.id} value={l.id}>{l.titulo}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Estado" name="estado">
            <Select>{ESTADOS.map(e => <Select.Option key={e} value={e}>{e}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item label="Código del ejemplar" name="codigo">
            <Input placeholder="Ej. EJ-001" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
