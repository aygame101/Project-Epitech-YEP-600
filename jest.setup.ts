require('@testing-library/jest-native/extend-expect')

// fetch polyfill
if (!global.fetch) {
  // @ts-ignore
  global.fetch = (...args: any) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args))
}


//  AsyncStorage mock (évite le module natif en tests)
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
jest.mock('expo-constants', () => ({ __esModule: true, default: {} }))


//  Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
  useSearchParams: () => ({}),
}))


//  Reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))


//  WebView (évite le TurboModule natif)
jest.mock('react-native-webview', () => {
  const React = require('react')
  const { View } = require('react-native')
  const MockWebView = React.forwardRef((props: any, ref: any) =>
    React.createElement(View, { ...props, ref, testID: props?.testID || 'webview' })
  )
  return { WebView: MockWebView, default: MockWebView }
})


//  useFocusEffect comme useEffect
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useFocusEffect: (cb: any) => {
      const React = require('react')
      React.useEffect(() => cb(), [cb])
    },
  }
})


//  Safe area
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))


//  Expo StatusBar → noop (ou bien polyfills set/clearImmediate)
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }))


//  Polyfills si tu ne mocks pas expo-status-bar
if (!global.setImmediate) {
  // @ts-ignore
  global.setImmediate = (fn: any, ...args: any[]) => setTimeout(fn, 0, ...args)
}
if (!global.clearImmediate) {
  // @ts-ignore
  global.clearImmediate = (id: any) => clearTimeout(id)
}


// Expo Constants mock avec extra
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    manifest: null,
    expoConfig: {
      extra: {
        API_KEY: 'test',
        AUTH_DOMAIN: 'test',
        PROJECT_ID: 'test',
        STORAGE_BUCKET: 'test',
        MESSAGING_SENDER_ID: 'test',
        APP_ID: 'test',
        MEASUREMENT_ID: 'test',
      },
    },
  },
}))