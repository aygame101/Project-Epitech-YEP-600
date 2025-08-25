// components/GameRecommendationComponent.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { getGameRecommendations, getPersonalizedTips } from '../ia/recommandation';
import { auth } from '../config/firebaseConfig';
import { getUser } from './routes/firebaseService';
import { GameRecommendationComponentStyles as styles } from './styles';

const GameRecommendationComponent = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    loadUserRecommendations();
  }, []);

  const loadUserRecommendations = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      // Recuperer les donnees utilisateur depuis Firebase
      const userData = await getUser(user.uid);
      if (userData) {
        // Simuler des donnees de jeu pour la demonstration
        const mockGameData = {
          ...userData,
          gameHistory: [
            { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { gameType: 'slot', result: 'loss', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
          ],
          totalWins: 2,
          totalLosses: 1
        };

        const recs = getGameRecommendations(mockGameData);
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations:', error);
      Alert.alert('Erreur', 'Impossible de charger les recommandations');
    } finally {
      setLoading(false);
    }
  };

  const handleGameSelect = (gameType) => {
    setSelectedGame(gameType);
  };

  const getGameIcon = (gameType) => {
    if (gameType === 'blackjack') return 'B';
    if (gameType === 'slot') return 'S';
    return 'G';
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty.toLowerCase().includes('facile')) return '#00ff00';
    if (difficulty.toLowerCase().includes('moyenne')) return '#ffff00';
    if (difficulty.toLowerCase().includes('difficile')) return '#ff0000';
    return '#0000ff';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement des recommandations...</Text>
      </View>
    );
  }

  if (!recommendations) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Aucune recommandation disponible</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* En-tete avec score et niveau */}
      <View style={styles.header}>
        <Text style={styles.title}>Recommandations Personnalisees</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Votre Score:</Text>
          <Text style={styles.scoreValue}>{recommendations.userScore}</Text>
        </View>
        <View style={styles.levelContainer}>
          <Text style={styles.levelLabel}>Niveau:</Text>
          <Text style={[styles.levelValue, { color: getDifficultyColor(recommendations.difficultyLevel) }]}>
            {recommendations.difficultyLevel}
          </Text>
        </View>
      </View>

      {/* Recommandation globale */}
      <View style={styles.globalRecommendation}>
        <Text style={styles.globalTitle}>Conseil General</Text>
        <Text style={styles.globalText}>{recommendations.overallRecommendation}</Text>
      </View>

      {/* Recommandations par jeu */}
      <View style={styles.gamesSection}>
        <Text style={styles.sectionTitle}>Jeux Recommandes</Text>
        
        {Object.entries(recommendations.games).map(([gameType, gameData]) => (
          <TouchableOpacity
            key={gameType}
            style={[
              styles.gameCard,
              selectedGame === gameType && styles.selectedGameCard
            ]}
            onPress={() => handleGameSelect(gameType)}
          >
            <View style={styles.gameHeader}>
              <Text style={styles.gameIcon}>{getGameIcon(gameType)}</Text>
              <Text style={styles.gameName}>
                {gameType === 'blackjack' ? 'Blackjack' : 'Machine a Sous'}
              </Text>
              <View style={styles.suitabilityContainer}>
                <Text style={styles.suitabilityLabel}>Pertinence:</Text>
                <Text style={[styles.suitabilityValue, { color: getDifficultyColor(gameData.difficulty) }]}>
                  {gameData.suitability}%
                </Text>
              </View>
            </View>

            <Text style={styles.gameDescription}>{gameData.description}</Text>
            
            <View style={styles.gameDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Difficulte:</Text>
                <Text style={[styles.detailValue, { color: getDifficultyColor(gameData.difficulty) }]}>
                  {gameData.difficulty}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mise recommandee:</Text>
                <Text style={styles.detailValue}>
                  {gameData.betRange.min}€ - {gameData.betRange.max}€
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Strategie:</Text>
                <Text style={styles.detailValue}>{gameData.strategy}</Text>
              </View>
            </View>

            {selectedGame === gameType && (
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Conseils Personnalises</Text>
                {getPersonalizedTips({ walletBalance: 600, gameHistory: [] }, gameType).map((tip, index) => (
                  <Text key={index} style={styles.tipText}>- {tip}</Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bouton d'action */}
      <TouchableOpacity style={styles.actionButton} onPress={loadUserRecommendations}>
        <Text style={styles.actionButtonText}>Actualiser les Recommandations</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default GameRecommendationComponent; 