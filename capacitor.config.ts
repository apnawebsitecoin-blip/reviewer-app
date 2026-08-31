import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reviewapp.android',
  appName: 'ReviewApp',
  webDir: 'out',
  server: {
    url: 'https://reviewer-app-orpin.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#4F46E5',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4F46E5',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
