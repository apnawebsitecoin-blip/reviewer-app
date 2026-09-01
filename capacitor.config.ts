import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.raikaro.reviewapp',
  appName: 'Raikaro',
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
      launchShowDuration: 1500,
      backgroundColor: '#4F46E5',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      fadeOutDuration: 300,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
