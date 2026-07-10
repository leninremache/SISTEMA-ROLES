import { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, Spin } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import API from '../services/api';

const { Title, Text } = Typography;

const SI = <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />;
const NO = <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />;

const ROL_COLOR = {
  Administrador: 'red',
  Bibliotecario: 'orange',
  Catalogador:   'blue',
  Profesor:      'purple',
  Lector:        'green',
};

// Permisos estáticos por rol (RBAC frontend)
const PERMISOS_FRONTEND = {
  Administrador: { cl: SI, el: SI, dll: SI, vu: SI, cu: SI, du: SI, vp: SI, cp: SI, dp: SI, ca: SI },
  Bibliotecario: { cl: SI, el: SI, dll: NO, vu: SI, cu: SI, du: NO, vp: SI, cp: SI, dp: SI, ca: SI },
  Catalogador:   { cl: NO, el: SI, dll: SI, vu: NO, cu: NO, du: NO, vp: SI, cp: NO, dp: NO, ca: SI },
  Profesor:      { cl: NO, el: NO, dll: NO, vu: NO, cu: NO, du: NO, vp: SI, cp: SI, dp: NO, ca: NO },
  Lector:        { cl: NO, el: NO, dll: NO, vu: NO, cu: NO, du: NO, vp: NO, cp: NO, dp: NO, ca: NO },
};

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/roles')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setRoles(data);
      })
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, []);

  const dataSource = roles.map(r => ({
    ...r,
    ...PERMISOS_FRONTEND[r.nombre],
    descuento: r.descuento_multa === 100
      ? <Tag color="green">Gratuito (100%)</Tag>
      : r.descuento_multa === 50
        ? <Tag color="orange">50% descuento</Tag>
        : <Tag>Sin descuento</Tag>,
    limite: r.limite_prestamos >= 999
      ? <Tag color="blue">Sin límite</Tag>
      : r.limite_prestamos === 0
        ? <Tag color="default">N/A</Tag>
        : <Tag color="gold">Máx. {r.limite_prestamos}</Tag>,
  }));

  const columns = [
    {
      title: 'Rol', dataIndex: 'nombre', key: 'nombre', fixed: 'left', width: 130,
      render: v => <Tag color={ROL_COLOR[v] || 'default'} style={{ fontWeight: 700, fontSize: 13 }}>{v}</Tag>,
    },
    { title: 'Descripción', dataIndex: 'descripcion', key: 'desc', width: 260, render: v => <Text type="secondary">{v}</Text> },
    { title: 'Crear Libros',     dataIndex: 'cl',  key: 'cl',  align: 'center', width: 110 },
    { title: 'Editar Libros',    dataIndex: 'el',  key: 'el',  align: 'center', width: 110 },
    { title: 'Elim. Libros',     dataIndex: 'dll', key: 'dll', align: 'center', width: 110 },
    { title: 'Ver Usuarios',     dataIndex: 'vu',  key: 'vu',  align: 'center', width: 110 },
    { title: 'Crear Usuarios',   dataIndex: 'cu',  key: 'cu',  align: 'center', width: 120 },
    { title: 'Elim. Usuarios',   dataIndex: 'du',  key: 'du',  align: 'center', width: 120 },
    { title: 'Ver Préstamos',    dataIndex: 'vp',  key: 'vp',  align: 'center', width: 115 },
    { title: 'Crear Préstamos',  dataIndex: 'cp',  key: 'cp',  align: 'center', width: 125 },
    { title: 'Elim. Préstamos',  dataIndex: 'dp',  key: 'dp',  align: 'center', width: 125 },
    { title: 'Gestión Autores',  dataIndex: 'ca',  key: 'ca',  align: 'center', width: 125 },
    { title: 'Descuento Multa',  dataIndex: 'descuento', key: 'dm', width: 160 },
    { title: 'Límite Préstamos', dataIndex: 'limite',    key: 'lp', width: 140, align: 'center' },
  ];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>🔐 Tabla de Roles — RBAC</Title>
        <Text type="secondary">Control de Acceso Basado en Roles (Role-Based Access Control) · Datos cargados desde la base de datos</Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 20, background: '#f0f5ff' }}>
        <Text>
          El sistema implementa <strong>RBAC</strong> en dos capas: el <strong>frontend</strong> controla qué botones 
          y secciones se muestran según el rol, y el <strong>backend</strong> valida los permisos en cada petición 
          HTTP antes de ejecutar cualquier operación en la base de datos.
        </Text>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : (
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1600 }}
          style={{ background: '#fff', borderRadius: 12 }}
          bordered
        />
      )}
    </div>
  );
}
