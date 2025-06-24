import React, { useRef, useState } from 'react';
import { Animated, Button, StyleSheet, Text, View } from 'react-native';

const SlotMachine = () => {
  const SYMBOLS = ['🍒', '🍋', '🍊', '🍉', '7️⃣', '💎', '🍓', '🍇'];
  const [slots, setSlots] = useState([
    [0, 0, 0], // Ligne du haut
    [1, 1, 1], // Ligne du milieu
    [2, 2, 2]  // Ligne du bas
  ]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('');
  const [winningLines, setWinningLines] = useState([]);
  
  // Références pour les animations de chaque colonne (3 colonnes)
  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  const spin = () => {
    if (spinning) return;
    
    setSpinning(true);
    setResult('');
    setWinningLines([]);
    
    // Générer les nouveaux résultats pour chaque colonne
    const newSlots = [
      [
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length)
      ],
      [
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length)
      ],
      [
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length)
      ]
    ];
    
    // Animer chaque colonne avec des durées différentes
    const animations = animatedValues.map((animValue, colIndex) => {
      const duration = 1500 + (colIndex * 300);
      const totalSymbols = SYMBOLS.length * 4;
      // Calculer la position finale pour que les bons symboles soient visibles
      const finalPosition = totalSymbols - SYMBOLS.length + newSlots[0][colIndex];
      
      animValue.setValue(0);
      
      return Animated.timing(animValue, {
        toValue: finalPosition,
        duration: duration,
        useNativeDriver: true,
      });
    });
    
    // Démarrer toutes les animations en parallèle
    Animated.parallel(animations).start(() => {
      // Une fois l'animation terminée, mettre à jour les résultats
      checkWin(newSlots);
      setSpinning(false);
      setSlots(newSlots);
    });
  };

  const checkWin = (newSlots) => {
    const winners = [];
    let totalWins = 0;
    
    // Vérifier les lignes horizontales
    for (let row = 0; row < 3; row++) {
      if (newSlots[row][0] === newSlots[row][1] && newSlots[row][1] === newSlots[row][2]) {
        winners.push(`ligne-${row}`);
        totalWins++;
      }
    }
    
    // Vérifier les colonnes verticales
    for (let col = 0; col < 3; col++) {
      if (newSlots[0][col] === newSlots[1][col] && newSlots[1][col] === newSlots[2][col]) {
        winners.push(`colonne-${col}`);
        totalWins++;
      }
    }
    
    // Vérifier la diagonale principale (haut-gauche vers bas-droite)
    if (newSlots[0][0] === newSlots[1][1] && newSlots[1][1] === newSlots[2][2]) {
      winners.push('diagonale-principale');
      totalWins++;
    }
    
    // Vérifier la diagonale secondaire (haut-droite vers bas-gauche)
    if (newSlots[0][2] === newSlots[1][1] && newSlots[1][1] === newSlots[2][0]) {
      winners.push('diagonale-secondaire');
      totalWins++;
    }
    
    setWinningLines(winners);
    
    if (totalWins > 0) {
      if (totalWins >= 3) {
        setResult(`MÉGA JACKPOT ! 🎰🎉 (${totalWins} lignes !)`);
      } else if (totalWins === 2) {
        setResult(`SUPER GAIN ! 🎊💰 (${totalWins} lignes !)`);
      } else {
        // Vérifier le type de symbole pour le gain simple
        const winningSymbol = getWinningSymbol(newSlots, winners[0]);
        if (winningSymbol === '7️⃣') {
          setResult('JACKPOT 777 ! 🎰✨');
        } else if (winningSymbol === '💎') {
          setResult('JACKPOT DIAMANT ! 💎🌟');
        } else {
          setResult('BEAU GAIN ! 🎉💰');
        }
      }
    } else {
      setResult('Perdu... Essayez encore ! 🤞');
    }
  };

  const getWinningSymbol = (newSlots, winningLine) => {
    if (winningLine.startsWith('ligne-')) {
      const row = parseInt(winningLine.split('-')[1]);
      return SYMBOLS[newSlots[row][0]];
    } else if (winningLine.startsWith('colonne-')) {
      const col = parseInt(winningLine.split('-')[1]);
      return SYMBOLS[newSlots[0][col]];
    } else if (winningLine === 'diagonale-principale') {
      return SYMBOLS[newSlots[1][1]];
    } else if (winningLine === 'diagonale-secondaire') {
      return SYMBOLS[newSlots[1][1]];
    }
    return '';
  };

  const renderColumn = (colIndex) => {
    const animatedValue = animatedValues[colIndex];
    const extendedSymbols = [...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS];
    
    return (
      <View key={colIndex} style={styles.columnContainer}>
        {[0, 1, 2].map((rowIndex) => (
          <View key={`${colIndex}-${rowIndex}`} style={styles.reelContainer}>
            <View style={styles.reelWindow}>
              {spinning ? (
                // Pendant l'animation : afficher la bande défilante
                extendedSymbols.map((symbol, symbolIndex) => {
                  const translateY = animatedValue.interpolate({
                    inputRange: [0, extendedSymbols.length],
                    outputRange: [rowIndex * 80, -(extendedSymbols.length * 80) + (rowIndex * 80)],
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
                })
              ) : (
                // Après l'animation : afficher le symbole final fixe
                <View style={styles.symbolContainer}>
                  <Text style={styles.symbol}>
                    {SYMBOLS[slots[rowIndex][colIndex]]}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎰 MACHINE À SOUS 3x3 🎰</Text>
      
      <View style={styles.slotsContainer}>
        {[0, 1, 2].map(renderColumn)}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Lignes gagnantes : Horizontales • Verticales • Diagonales
        </Text>
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
          {winningLines.length > 0 && (
            <Text style={styles.winningLines}>
              Lignes gagnantes : {winningLines.join(', ')}
            </Text>
          )}
        </View>
      ) : null}
      
      <Text style={styles.instructions}>
        Alignez 3 symboles identiques sur une ligne, colonne ou diagonale !
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
    marginBottom: 30,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  slotsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#2C2C2C',
    padding: 15,
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  columnContainer: {
    flexDirection: 'column',
    marginHorizontal: 3,
  },
  reelContainer: {
    width: 70,
    height: 70,
    marginVertical: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
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
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbol: {
    fontSize: 32,
    textAlign: 'center',
  },
  infoContainer: {
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultContainer: {
    marginTop: 25,
    padding: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    maxWidth: '90%',
  },
  result: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  winningLines: {
    fontSize: 14,
    color: '#81C784',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  instructions: {
    marginTop: 15,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
});

export default SlotMachine;