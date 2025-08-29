import '@testing-library/jest-native/extend-expect';

// Router
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
    useLocalSearchParams: () => ({}),
}));

// WebView
jest.mock('react-native-webview', () => ({ WebView: () => null }));

// Expo assets / FS
jest.mock('expo-asset', () => ({
    Asset: { fromModule: () => ({ downloadAsync: jest.fn(), localUri: 'file:///dummy.html' }) },
}));
jest.mock('expo-file-system', () => ({
    readAsStringAsync: jest.fn(async () => '<html></html>'),
    writeAsStringAsync: jest.fn(async () => { }),
    documentDirectory: '/documents/',
}));

// Skia (si présent dans ton chat)
jest.mock('@shopify/react-native-skia', () => ({
    Canvas: () => null, Rect: () => null, RadialGradient: () => null, vec: () => ({}),
}));

// Mock officiel d'AsyncStorage
jest.mock(
    '@react-native-async-storage/async-storage',
    () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

