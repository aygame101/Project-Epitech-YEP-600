import React, { useRef, useState } from 'react';
import { Animated, Button, StyleSheet, Text, View } from 'react-native';

const SlotMachine = () => {
  const SYMBOLS = ['🍒', '🍋', '🍊', '🍉', '7️⃣', '💎', '🍓', '🍇', '🍑'];
  const [slots, setSlots] = useState([0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('');
  
  // Références pour les animations de chaque reel
  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  const spin = () => {
    if (spinning) return;
    
    setSpinning(true);
    setResult('');
    
    // Générer les nouveaux résultats
    const newSlots = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length)
    ];
    
    // Animer chaque reel avec des durées différentes pour un effet plus réaliste
    const animations = animatedValues.map((animValue, index) => {
      const duration = 1500 + (index * 300); // Durées plus longues et échelonnées
      const totalSymbols = SYMBOLS.length * 4; // 4 répétitions des symboles
      const finalPosition = totalSymbols - SYMBOLS.length + newSlots[index];
      
      // Reset de la position de départ
      animValue.setValue(0);
      
      return Animated.timing(animValue, {
        toValue: finalPosition,
        duration: duration,
        useNativeDriver: true,
      });
    });
    
    // Démarrer toutes les animations en parallèle
    Animated.parallel(animations).start(() => {
      // Une fois l'animation terminée
      setSlots(newSlots);
      checkWin(newSlots);
      setSpinning(false);
      
      // Les valeurs d'animation restent à leur position finale
      // Pas besoin de les réinitialiser ici
    });
  };

  const checkWin = (newSlots) => {
    if (newSlots[0] === newSlots[1] && newSlots[1] === newSlots[2]) {
      if (SYMBOLS[newSlots[0]] === '7️⃣') {
        setResult('MEGA JACKPOT ! 🎰🎉');
      } else if (SYMBOLS[newSlots[0]] === '💎') {
        setResult('SUPER JACKPOT ! 💎✨');
      } else {
        setResult('JACKPOT ! 🎉🎊');
      }
    } else if (newSlots[0] === newSlots[1] || newSlots[1] === newSlots[2] || newSlots[0] === newSlots[2]) {
      setResult('Petit gain ! 💰');
    } else {
      setResult('Perdu... Essayez encore ! 🤞');
    }
  };

  const renderReel = (reelIndex) => {
    const animatedValue = animatedValues[reelIndex];
    
    // Créer une liste étendue de symboles pour l'animation continue
    const extendedSymbols = [...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS];
    
    return (
      <View key={reelIndex} style={styles.reelContainer}>
        <View style={styles.reelWindow}>
          {extendedSymbols.map((symbol, symbolIndex) => {
            const translateY = animatedValue.interpolate({
              inputRange: [0, extendedSymbols.length],
              outputRange: [0, -(extendedSymbols.length * 80)],
              extrapolate: 'clamp',
            });
            
            return (
              <Animated.View
                key={symbolIndex}
                style={[
                  styles.symbolContainer,
                  {
                    transform: [{ translateY }],
                    top: symbolIndex * 80,
                  },
                ]}
              >
                <Text style={styles.symbol}>{symbol}</Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎰 MACHINE À SOUS 🎰</Text>
      
      <View style={styles.slotsContainer}>
        {[0, 1, 2].map(renderReel)}
      </View>
      
      <Button
        title={spinning ? "🎲 EN COURS..." : "🎯 JOUER"}
        onPress={spin}
        disabled={spinning}
        color="#FF5722"
      />
      
      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.result}>{result}</Text>
        </View>
      ) : null}
      
      <Text style={styles.instructions}>
        Appuyez sur JOUER pour tenter votre chance !
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 40,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  slotsContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    backgroundColor: '#2C2C2C',
    padding: 20,
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  reelContainer: {
    width: 80,
    height: 80,
    margin: 5,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#444',
    overflow: 'hidden',
  },
  reelWindow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbol: {
    fontSize: 40,
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  result: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  instructions: {
    marginTop: 20,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SlotMachine;