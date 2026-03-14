import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env['CAP_SERVER_URL'];

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'AppMovilConcentradosPT',
  webDir: 'www',
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: true
        }
      }
    : {})
};

export default config;
