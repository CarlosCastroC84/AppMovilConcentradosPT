import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env['CAP_SERVER_URL'];

const config: CapacitorConfig = {
  appId: 'com.ucompensar.concentradospt',
  appName: 'Concentrados PT',
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
