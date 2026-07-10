import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Popconfirm, message, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const ROLES = ['Administrador', 'Catalogador', 'Bibliotecario', 'Lector'];
const ROL_COLOR = { Administrador: 'red', Catalogador: 'blue', Bibliotecario: 'orange', Lector: 'green' };

export default function Usuarios() {
  const { permisos } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  async function fetchUsuarios() {
    setLoading(true);
    try {
      const res = await API.get('/usuarios');
      setUsuarios(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setUsuarios([]); } finally { setLoading(false); }
  }

  useEffect(() => { fetchUsuarios(); }, []);

  function openCreate() { setEditItem(null); form.resetFields(); form.setFieldValue('rol', 'Lector'); setShowModal(true); }
  function openEdit(u) { setEditItem(u); form.setFieldsValue({ ...u, password: '' }); setShowModal(true); }

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = { ...values };
      if (editItem && !payload.password) delete payload.password;
      if (editItem) await API.put(`/usuarios/${editItem.id}`, payload);
      else await API.post('/usuarios', payload);
      message.success(editItem ? 'Usuario actualizado' : 'Usuario creado');
      setShowModal(false);
      fetchUsuarios();
    } catch (err) {
      message.error(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await API.delete(`/usuarios/${id}`);
      message.success('Usuario eliminado');
      fetchUsuarios();
    } catch { message.error('Error al eliminar'); }
  }

  const filtered = usuarios.filter(u =>
    (u.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.rol || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Nombre', dataIndex: 'nombre', key: 'nombre',
      render: (n, r) => (
        <Space>
          <Avatar style={{ background: ROL_COLOR[r.rol] === 'red' ? '#f5222d' : ROL_COLOR[r.rol] === 'blue' ? '#1677ff' : ROL_COLOR[r.rol] === 'orange' ? '#fa8c16' : '#52c41a' }}>
            {(n || 'U')[0].toUpperCase()}
          </Avatar>
          <Text strong>{n}</Text>
        </Space>
      )
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Rol', dataIndex: 'rol', key: 'rol', render: v => <Tag color={ROL_COLOR[v] || 'default'}>{v}</Tag> },
    { title: 'Teléfono', dataIndex: 'telefono', key: 'telefono', render: v => v || '—' },
    {
      title: 'Acciones', key: 'acciones',
      render: (_, r) => (
        <Space>
          {permisos.editarUsuarios && <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Editar</Button>}
          {permisos.eliminarUsuarios && (
            <Popconfirm title={`¿Eliminar a "${r.nombre}"?`} onConfirm={() => handleDelete(r.id)} okText="Sí" cancelText="No">
              <Button size="small" danger icon={<DeleteOutlined />}>Eliminar</Button>
            </Popconfirm>
          )}
          {!permisos.editarUsuarios && !permisos.eliminarUsuarios && <Text type="secondary">Solo lectura</Text>}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>👥 Usuarios</Title>
          <Text type="secondary">Gestión de usuarios del sistema</Text>
        </div>
        {permisos.crearUsuarios && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Agregar usuario</Button>}
      </div>

      <Input.Search placeholder="Buscar por nombre, email, rol..." value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16, maxWidth: 400 }} />

      <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading}
        pagination={{ pageSize: 10 }} style={{ background: '#fff', borderRadius: 12 }} />

      <Modal title={editItem ? 'Editar usuario' : 'Agregar usuario'}
        open={showModal} onOk={handleSave} onCancel={() => setShowModal(false)}
        okText={editItem ? 'Guardar cambios' : 'Agregar'} confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item label={editItem ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña'} name="password"
            rules={editItem ? [] : [{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="Rol" name="rol">
              <Select>{ROLES.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}</Select>
            </Form.Item>
            <Form.Item label="Teléfono" name="telefono"><Input /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
