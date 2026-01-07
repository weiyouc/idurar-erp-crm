import { ConfigProvider } from 'antd';
import { useAppContext } from '@/context/appContext';
import antdLocale from './antdLocale';

export default function Localization({ children }) {
  const { state } = useAppContext();
  const currentLocale = antdLocale[state.language] || antdLocale.en_us;

  return (
    <ConfigProvider
      locale={currentLocale}
      theme={{
        token: {
          colorPrimary: '#339393',
          colorLink: '#1640D6',
          borderRadius: 0,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
