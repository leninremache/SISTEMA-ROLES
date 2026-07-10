import { Table, Tag, Typography, Card } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

const SI  = <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />;
const NO  = <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />;

const roles = [
  {
    rol: 'Administrador', color: 'red',
    crearLibros: SI,  editarLibros: SI,  eliminarLibros: SI,
    verUsuarios: SI,  crearUsuarios: SI, eliminarUsuarios: SI,
    verPrestamos: SI, crearPrestamos: SI, eliminarPrestamos: SI,
    verAutores: SI,   crearAutores: SI,
    descuentoMulta: 'Sin descuento',
    limitePrestamos: 'Sin límite',
    observacion: 'Acceso total al sistema',
  },
  {
    rol: 'Bibliotecario', color: 'orange',
    crearLibros: SI,  editarLibros: SI,  eliminarLibros: NO,
    verUsuarios: SI,  crearUsuarios: SI, eliminarUsuarios: NO,
    verPrestamos: SI, crearPrestamos: SI, eliminarPrestamos: SI,
    verAutores: SI,   crearAutores: SI,
    descuentoMulta: 'Sin descuento',
    limitePrestamos: 'Máx. 3 activos',
    observacion: 'Único que puede crear libros',
  },
  {
    rol: 'Catalogador', color: 'blue',
    crearLibros: NO,  editarLibros: SI,  eliminarLibros: SI,
    verUsuarios: NO,  crearUsuarios: NO, eliminarUsuarios: NO,
    verPrestamos: SI, crearPrestamos: NO, eliminarPrestamos: NO,
    verAutores: SI,   crearAutores: SI,
    descuentoMulta: 'Sin descuento',
    limitePrestamos: '—',
    observacion: 'Gestiona el catálogo bibliográfico',
  },
  {
    rol: 'Profesor', color: 'purple',
    crearLibros: NO,  editarLibros: NO,  eliminarLibros: NO,
    verUsuarios: NO,  crearUsuarios: NO, eliminarUsuarios: NO,
    verPrestamos: SI, crearPrestamos: SI, eliminarPrestamos: NO,
    verAutores: SI,   crearAutores: NO,
    descuentoMulta: '100% (préstamos gratuitos)',
    limitePrestamos: 'Sin límite',
    observacion: 'Préstamos completamente gratuitos',
  },
  {
    rol: 'Lector', color: 'green',
    crearLibros: NO,  editarLibros: NO,  eliminarLibros: NO,
    verUsuarios: NO,  crearUsuarios: NO, eliminarUsuarios: NO,
    verPrestamos: NO, crearPrestamos: NO, eliminarPrestamos: NO,
    verAutores: NO,   crearAutores: NO,
    descuentoMulta: '50% de descuento',
    limitePrestamos: 'Máx. 3 activos',
    observacion: 'Solo consulta el catálogo',
  },
];

const columns = [
  {
    title: 'Rol', dataIndex: 'rol', key: 'rol', fixed: 'left', width: 120,
    render: (v, r) => <Tag color={r.color} style={{ fontWeight: 700, fontSize: 13 }}>{v}</Tag>,
  },
  { title: 'Crear Libros',    dataIndex: 'crearLibros',       key: 'cl',  align: 'center', width: 110 },
  { title: 'Editar Libros',   dataIndex: 'editarLibros',      key: 'el',  align: 'center', width: 110 },
  { title: 'Eliminar Libros', dataIndex: 'eliminarLibros',    key: 'dll', align: 'center', width: 120 },
  { title: 'Ver Usuarios',    dataIndex: 'verUsuarios',       key: 'vu',  align: 'center', width: 110 },
  { title: 'Crear Usuarios',  dataIndex: 'crearUsuarios',     key: 'cu',  align: 'center', width: 120 },
  { title: 'Elim. Usuarios',  dataIndex: 'eliminarUsuarios',  key: 'du',  align: 'center', width: 120 },
  { title: 'Ver Préstamos',   dataIndex: 'verPrestamos',      key: 'vp',  align: 'center', width: 115 },
  { title: 'Crear Préstamos', dataIndex: 'crearPrestamos',    key: 'cp',  align: 'center', width: 125 },
  { title: 'Elim. Préstamos', dataIndex: 'eliminarPrestamos', key: 'dp',  align: 'center', width: 125 },
  { title: 'Gestión Autores', dataIndex: 'crearAutores',      key: 'ca',  align: 'center', width: 125 },
  {
    title: 'Descuento Multa', dataIndex: 'descuentoMulta', key: 'dm', width: 180,
    render: v => <Text style={{ color: v.includes('gratuitos') ? '#52c41a' : v.includes('50%') ? '#fa8c16' : undefined }}>{v}</Text>,
  },
  { title: 'Límite Préstamos', dataIndex: 'limitePrestamos', key: 'lp', width: 140 },
  {
    title: 'Observación', dataIndex: 'observacion', key: 'obs', width: 220,
    render: v => <Text type="secondary">{v}</Text>,
  },
];

export default function Roles() {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>🔐 Tabla de Roles — RBAC</Title>
        <Text type="secondary">Control de Acceso Basado en Roles (Role-Based Access Control)</Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 20 }}>
        <Text>
          El sistema implementa <strong>RBAC</strong> en dos capas: el <strong>frontend</strong> controla qué botones y secciones 
          se muestran, y el <strong>backend</strong> valida los permisos en cada petición antes de ejecutar cualquier operación.
        </Text>
      </Card>

      <Table
        dataSource={roles}
        columns={columns}
        rowKey="rol"
        pagination={false}
        scroll={{ x: 1400 }}
        style={{ background: '#fff', borderRadius: 12 }}
        bordered
      />
    </div>
  );
}
