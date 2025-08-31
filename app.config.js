// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
...config,
expo: {
    name: "EpiGamble",
    slug: "EpiGamble",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "epigamble",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
        "windowSoftInputMode": "adjustResize"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-asset"
    ],
    experiments: {
      typedRoutes: true
    },
    assetBundlePatterns: [
      "assets/web/"
    ],
    extra: {
    API_KEY:       process.env.API_KEY,
    AUTH_DOMAIN:   process.env.AUTH_DOMAIN,
    PROJECT_ID:    process.env.PROJECT_ID,
    STORAGE_BUCKET: process.env.STORAGE_BUCKET,
    MESSAGING_SENDER_ID: process.env.MESSAGING_SENDER_ID,
    APP_ID:        process.env.APP_ID,
    MEASUREMENT_ID: process.env.MEASUREMENT_ID,
    },
  }
});
