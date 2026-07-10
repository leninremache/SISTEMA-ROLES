import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Tag, Space, Typography, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RollbackOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const ESTADO_COLOR = { Activo: 'blue', Devuelto: 'green', Vencido: 'red', Renovado: 'orange', devuelto: 'green', activo: 'blue' };

export default function Prestamos() {
  const { permisos } = useAuth();
  const [prestamos, setPrestamos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  async function fetchPrestamos() {
    setLoading(true);
    try {
      const res = await API.get('/prestamos');
      setPrestamos(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setPrestamos([]); } finally { setLoading(false); }
  }

  async function fetchUsuarios() {
    try {
      const res = await API.get('/usuarios');
      setUsuarios(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setUsuarios([]); }
  }

  useEffect(() => { fetchPrestamos(); fetchUsuarios(); }, []);

  function openCreate() { setEditItem(null); form.resetFields(); setShowModal(true); }
  function openEdit(p) {
    setEditItem(p);
    form.setFieldsValue({
      usuario_id: p.id_usuario,
      ejemplar_id: p.id_ejemplar,
      fecha_devolucion_esperada: p.fecha_devolucion ? dayjs(p.fecha_devolucion) : null,
    });
    setShowModal(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        usuario_id: values.usuario_id,
        ejemplar_id: values.ejemplar_id,
        fecha_devolucion_esperada: values.fecha_devolucion_esperada?.format('YYYY-MM-DD'),
      };
      if (editItem) await API.put(`/prestamos/${editItem.id}`, payload);
      else await API.post('/prestamos', payload);
      message.success(editItem ? 'Préstamo actualizado' : 'Préstamo creado');
      setShowModal(false);
      fetchPrestamos();
    } catch (err) {
      message.error(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function handleDevolver(p) {
    try {
      await API.put(`/prestamos/${p.id}`, { estado: 'Devuelto', fecha_devolucion: dayjs().format('YYYY-MM-DD') });
      message.success('Devolución registrada');
      fetchPrestamos();
    } catch { message.error('Error al registrar devolución'); }
  }

  async function handleDelete(id) {
    try {
      await API.delete(`/prestamos/${id}`);
      message.success('Préstamo eliminado');
      fetchPrestamos();
    } catch { message.error('Error al eliminar'); }
  }

  const filtered = prestamos.filter(p =>
    String(p.id).includes(search) ||
    (p.nombre_usuario || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.estado || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: v => <Text strong>#{v}</Text>, width: 70 },
    { title: 'Usuario', dataIndex: 'nombre_usuario', key: 'usuario', render: v => v || '—' },
    {
      title: 'Ejemplar', key: 'ejemplar',
      render: (_, r) => r.libro_titulo
        ? <span>{r.libro_titulo} <Text type="secondary" style={{ fontSize: 11 }}>({r.codigo_ejemplar || `#${r.id_ejemplar}`})</Text></span>
        : `Ejemplar #${r.id_ejemplar}`
    },
    { title: 'Fecha Salida', dataIndex: 'fecha_salida', key: 'fecha_salida', render: v => v ? dayjs(v).format('DD MMM YYYY') : '—' },
    { title: 'Fecha Devolución', dataIndex: 'fecha_devolucion', key: 'fecha_devolucion', render: v => v ? dayjs(v).format('DD MMM YYYY') : '—' },
    { title: 'Estado', dataIndex: 'estado', key: 'estado', render: v => <Tag color={ESTADO_COLOR[v] || 'default'}>{v}</Tag> },
    {
      title: 'Acciones', key: 'acciones',
      render: (_, r) => (
        <Space>
          {permisos.editarPrestamos && r.estado !== 'Devuelto' && r.estado !== 'devuelto' && (
            <Popconfirm title={`¿Registrar devolución del préstamo #${r.id}?`} onConfirm={() => handleDevolver(r)} okText="Sí" cancelText="No">
              <Button size="small" icon={<RollbackOutlined />}>Devolver</Button>
            </Popconfirm>
          )}
          {permisos.editarPrestamos && <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Editar</Button>}
          {permisos.eliminarPrestamos && (
            <Popconfirm title={`¿Eliminar préstamo #${r.id}?`} onConfirm={() => handleDelete(r.id)} okText="Sí" cancelText="No">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
          {!permisos.editarPrestamos && !permisos.eliminarPrestamos && <Text type="secondary">Solo lectura</Text>}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>📋 Préstamos</Title>
          <Text type="secondary">Registro y control de préstamos</Text>
        </div>
        {permisos.crearPrestamos && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nuevo préstamo</Button>}
      </div>

      <Input.Search placeholder="Buscar por ID, usuario, estado..." value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16, maxWidth: 400 }} />

      <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading}
        pagination={{ pageSize: 10 }} style={{ background: '#fff', borderRadius: 12 }} />

      <Modal title={editItem ? 'Editar préstamo' : 'Nuevo préstamo'}
        open={showModal} onOk={handleSave} onCancel={() => setShowModal(false)}
        okText={editItem ? 'Guardar' : 'Crear'} confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Usuario" name="usuario_id" rules={[{ required: true }]}>
            <Select placeholder="Seleccionar usuario">
              {usuarios.map(u => <Select.Option key={u.id} value={u.id}>{u.nombre} ({u.email})</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="ID del Ejemplar" name="ejemplar_id" rules={[{ required: true }]}>
            <Input type="number" placeholder="ID del ejemplar" />
          </Form.Item>
          <Form.Item label="Fecha de devolución esperada" name="fecha_devolucion_esperada">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
