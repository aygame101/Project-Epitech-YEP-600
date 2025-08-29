/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // ⬇️ Autorise la transpilation Babel de TOUS les paquets Expo/RN nécessaires,
  // y compris **expo-modules-core** et tous les "expo-*" (expo-router, etc.)
  transformIgnorePatterns: [
    '/node_modules/(?!(?:' +
      'react-native' +
      '|@react-native' +
      '|@react-navigation' +
      '|@react-native-community' +
      '|expo(?:-[^/]+)?' +            // <-- "expo", "expo-modules-core", "expo-router", etc.
      '|@expo(?:/.*)?' +
      '|react-native-webview' +
      '|@shopify/react-native-skia' +
      '|expo-asset' +
      '|expo-font' +
      '|firebase' +
    ')/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
