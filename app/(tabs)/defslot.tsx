import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import SlotGame from '../../components/games/SlotGameWebView';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <SlotGame />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1 }
});