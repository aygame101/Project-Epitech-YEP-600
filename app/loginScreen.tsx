import { StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/expo/ThemedText';
import { ThemedView } from '@/components/expo/ThemedView';
import { Auth } from '@/components/services/auth';

function App() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.text}><Auth /><>
      </></ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
});

export default App;