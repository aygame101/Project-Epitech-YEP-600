import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export default function SlotGameWebView() {
  const [htmlContent, setHtmlContent] = useState(null);
  const [baseUrl, setBaseUrl]       = useState(null);

  useEffect(() => {
    (async () => {
      // 1) Télécharge index.html comme asset
      const htmlAsset = Asset.fromModule(
        require('../../assets/web/slot/dist/index.html')
      );
      await htmlAsset.downloadAsync();

      // 2) Prépare le dossier local
      const destDir = FileSystem.documentDirectory + 'slotgame/';
      await FileSystem.deleteAsync(destDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });

      // 3) Copie l’intégralité de dist/
      const bundleDist = htmlAsset.bundleUri.replace('index.html', '');
      const files = await FileSystem.readDirectoryAsync(bundleDist);
      for (const fname of files) {
        await FileSystem.copyAsync({
          from: bundleDist + fname,
          to:   destDir    + fname
        });
      }

      // 4) Lit le HTML dans une string
      const htmlPath = destDir + 'index.html';
      const content  = await FileSystem.readAsStringAsync(htmlPath);

      // 5) Détermine le baseUrl pour que les <script src> relatifs fonctionnent
      const url = Platform.OS === 'ios'
        ? destDir
        : 'file://' + destDir;

      // 6) Mettez en état
      setHtmlContent(content);
      setBaseUrl(url);
    })();
  }, []);

  if (!htmlContent || !baseUrl) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WebView
      style={{ flex: 1 }}
      originWhitelist={['*']}
      source={{ html: htmlContent, baseUrl }}
      onLoad={() => console.log('WebView onLoad')}
      onError={e => console.error('WebView error', e.nativeEvent)}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
    />
  );
}
