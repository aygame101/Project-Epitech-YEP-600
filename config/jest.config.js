module.exports = {
  preset: 'jest-expo',          
  testEnvironment: 'jsdom',     
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'], 
  transformIgnorePatterns: [
    "node_modules/(?!(expo|react-native|@react-native|@expo|@react-native-community)/)"
  ],
};
