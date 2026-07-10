import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Popconfirm, message, Alert, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RollbackOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const ESTADO_COLOR = { Activo: 'blue', Devuelto: 'green', Vencido: 'red', Renovado: 'orange', devuelto: 'green', activo: 'blue' };
const TIPOS_DOC = ['Cédula de Identidad', 'Pasaporte', 'Carnet Estudiantil', 'Licencia de Conducir'];

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
    form.setFieldsValue({ usuario_id: p.id_usuario, ejemplar_id: p.id_ejemplar });
    setShowModal(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        usuario_id: values.usuario_id,
        ejemplar_id: values.ejemplar_id,
        tipo_documento: values.tipo_documento,
        numero_documento: values.numero_documento,
      };
      if (editItem) await API.put(`/prestamos/${editItem.id}`, payload);
      else await API.post('/prestamos', payload);
      message.success(editItem ? 'Préstamo actualizado' : 'Préstamo creado. Fecha de devolución: 10 días desde hoy.');
      setShowModal(false);
      fetchPrestamos();
    } catch (err) {
      message.error(err.response?.data?.message || 'Error al guardar el préstamo.');
    } finally { setSaving(false); }
  }

  async function handleDevolver(p) {
    try {
      const res = await API.put(`/prestamos/${p.id}`, {
        estado: 'Devuelto',
        fecha_devolucion: dayjs().format('YYYY-MM-DD'),
      });
      const multa = res.data?.multa_generada || 0;
      if (multa > 0) {
        message.warning(`Devolución registrada con retraso. Multa generada: $${multa.toFixed(2)} (descuento de 50% si es estudiante ya aplicado)`);
      } else {
        message.success('Devolución registrada sin multa.');
      }
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
    (p.estado || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.libro_titulo || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.numero_documento || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: v => <Text strong>#{v}</Text>, width: 60 },
    { title: 'Usuario', dataIndex: 'nombre_usuario', key: 'usuario', render: v => v || '—' },
    { title: 'Tipo Doc.', dataIndex: 'tipo_documento', key: 'tipo_doc', render: v => v || '—' },
    { title: 'N° Documento', dataIndex: 'numero_documento', key: 'num_doc', render: v => v ? <Text code>{v}</Text> : '—' },
    {
      title: 'Libro', key: 'libro',
      render: (_, r) => r.libro_titulo
        ? <span>{r.libro_titulo} <Text type="secondary" style={{ fontSize: 11 }}>({r.codigo_ejemplar || `#${r.id_ejemplar}`})</Text></span>
        : `Ejemplar #${r.id_ejemplar}`
    },
    { title: 'Fecha Salida', dataIndex: 'fecha_salida', key: 'fecha_salida', render: v => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'Devolución Límite', dataIndex: 'fecha_devolucion_esperada', key: 'fecha_esp', render: v => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'Estado', dataIndex: 'estado', key: 'estado', render: v => <Tag color={ESTADO_COLOR[v] || 'default'}>{v}</Tag> },
    {
      title: 'Multa', dataIndex: 'multa', key: 'multa',
      render: v => parseFloat(v) > 0 ? <Tag color="red">${parseFloat(v).toFixed(2)}</Tag> : <Tag color="green">Sin multa</Tag>
    },
    {
      title: 'Acciones', key: 'acciones',
      render: (_, r) => (
        <Space>
          {permisos.editarPrestamos && r.estado !== 'Devuelto' && r.estado !== 'devuelto' && (
            <Popconfirm title={`¿Registrar devolución del préstamo #${r.id}?`} onConfirm={() => handleDevolver(r)} okText="Sí" cancelText="No">
              <Button size="small" icon={<RollbackOutlined />} type="primary" ghost>Devolver</Button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>📋 Préstamos</Title>
          <Text type="secondary">Registro y control de préstamos · Límite: 10 días · Máx. 3 activos por usuario</Text>
        </div>
        {permisos.crearPrestamos && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nuevo préstamo</Button>}
      </div>

      <Input.Search
        placeholder="Buscar por ID, usuario, libro, N° documento, estado..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 500 }}
        allowClear
      />

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        style={{ background: '#fff', borderRadius: 12 }}
        locale={{ emptyText: <Empty description={search ? `No se encontraron préstamos para "${search}"` : 'No hay préstamos registrados'} /> }}
      />

      <Modal
        title={editItem ? 'Editar préstamo' : 'Nuevo préstamo'}
        open={showModal}
        onOk={handleSave}
        onCancel={() => setShowModal(false)}
        okText={editItem ? 'Guardar' : 'Crear préstamo'}
        confirmLoading={saving}
        width={520}
      >
        <Alert
          message="La fecha de devolución se calcula automáticamente a 10 días desde hoy."
          type="info" showIcon style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical">
          <Form.Item label="Usuario" name="usuario_id" rules={[{ required: true, message: 'Selecciona un usuario' }]}>
            <Select placeholder="Seleccionar usuario" showSearch optionFilterProp="children">
              {usuarios.map(u => <Select.Option key={u.id} value={u.id}>{u.nombre} ({u.email})</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Tipo de Documento" name="tipo_documento" rules={[{ required: true, message: 'Selecciona el tipo de documento' }]}>
            <Select placeholder="Seleccionar tipo de documento">
              {TIPOS_DOC.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Número de Documento" name="numero_documento" rules={[{ required: true, message: 'Ingresa el número de documento' }]}>
            <Input placeholder="Ej. 1234567890" />
          </Form.Item>
          <Form.Item label="ID del Ejemplar" name="ejemplar_id" rules={[{ required: true, message: 'Ingresa el ID del ejemplar' }]}>
            <Input type="number" placeholder="ID del ejemplar (ver sección Ejemplares)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
