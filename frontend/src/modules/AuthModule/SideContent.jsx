import { Layout, Typography } from 'antd';
import logo from '@/style/images/sp.png';
import useLanguage from '@/locale/useLanguage';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function SideContent() {
  const translate = useLanguage();

  return (
    <Content
      style={{
        padding: '150px 30px 30px',
        width: '100%',
        maxWidth: '450px',
        margin: '0 auto',
      }}
      className="sideContent"
    >
      <div style={{ width: '100%' }}>
        <img
          src={logo}
          alt="IDURAR ERP CRM"
          style={{ margin: '0 0 40px', display: 'block' }}
          height={63}
          width={220}
        />

        <Title level={2} style={{ fontSize: 26, marginBottom: 12 }}>
          Welcome to Silver Plan CRM System
        </Title>

        <div className="space20"></div>
      </div>
    </Content>
  );
}
