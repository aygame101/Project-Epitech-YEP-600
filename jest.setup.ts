/* jest.setup.ts */
require('@testing-library/jest-native/extend-expect')

// Polyfill fetch pour Jest, compatible CommonJS et ES Modules
if (!global.fetch) {
  global.fetch = (...args: any) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args))
}

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
  useSearchParams: () => ({}),
}))

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))
