// components/GameDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { auth } from '../config/firebaseConfig';
import { getUser } from './routes/firebaseService';
import { getUserGameStats, getRecentPerformance, getBestPerformances } from './routes/gameStatsService';
import GameRecommendationComponent from './GameRecommendationComponent';
import { GameDashboardStyles as styles } from './styles';

const GameDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  const [recentPerformance, setRecentPerformance] = useState(null);
  const [bestPerformances, setBestPerformances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      // Charger les donnees utilisateur
      const userInfo = await getUser(user.uid);
      setUserData(userInfo);

      // Charger les statistiques de jeu
      const stats = await getUserGameStats(user.uid);
      setGameStats(stats);

      // Charger les performances recentes
      const recent = await getRecentPerformance(user.uid);
      setRecentPerformance(recent);

      // Charger les meilleures performances
      const best = await getBestPerformances(user.uid);
      setBestPerformances(best);

    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `${amount}€`;
  };

  const getPerformanceColor = (winRate) => {
    if (winRate >= 60) return '#00ff00';
    if (winRate >= 40) return '#ffff00';
    return '#ff0000';
  };

  const getTabButtonStyle = (tabName) => {
    return [
      styles.tabButton,
      activeTab === tabName && styles.activeTabButton
    ];
  };

  const getTabButtonTextStyle = (tabName) => {
    return [
      styles.tabButtonText,
      activeTab === tabName && styles.activeTabButtonText
    ];
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Aucune donnee utilisateur disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tete du tableau de bord */}
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de Bord</Text>
        <Text style={styles.subtitle}>Bienvenue, {userData.username || 'Joueur'}!</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Solde actuel:</Text>
          <Text style={styles.balanceValue}>{formatCurrency(userData.walletBalance || 0)}</Text>
        </View>
      </View>

      {/* Onglets de navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={getTabButtonStyle('overview')}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={getTabButtonTextStyle('overview')}>Vue d'ensemble</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getTabButtonStyle('stats')}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={getTabButtonTextStyle('stats')}>Statistiques</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getTabButtonStyle('recommendations')}
          onPress={() => setActiveTab('recommendations')}
        >
          <Text style={getTabButtonTextStyle('recommendations')}>Recommandations</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu des onglets */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && (
          <View style={styles.overviewTab}>
            {/* Statistiques rapides */}
            <View style={styles.quickStats}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>*</Text>
                <Text style={styles.statValue}>{gameStats?.totalGames || 0}</Text>
                <Text style={styles.statLabel}>Parties jouees</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>*</Text>
                <Text style={styles.statValue}>{gameStats?.totalWins || 0}</Text>
                <Text style={styles.statLabel}>Victoires</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>*</Text>
                <Text style={styles.statValue}>
                  {gameStats && gameStats.totalGames > 0 ? Math.round((gameStats.totalWins / gameStats.totalGames) * 100) : 0}%
                </Text>
                <Text style={styles.statLabel}>Taux de victoire</Text>
              </View>
            </View>

            {/* Performance recente */}
            {recentPerformance && (
              <View style={styles.recentPerformance}>
                <Text style={styles.sectionTitle}>Performance Recente (7 jours)</Text>
                <View style={styles.performanceGrid}>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceValue}>{recentPerformance.gamesPlayed}</Text>
                    <Text style={styles.performanceLabel}>Parties</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceValue}>{recentPerformance.wins}</Text>
                    <Text style={styles.performanceLabel}>Victoires</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceValue}>{recentPerformance.losses}</Text>
                    <Text style={styles.performanceLabel}>Defaites</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={[styles.performanceValue, { color: getPerformanceColor(recentPerformance.winRate) }]}>
                      {Math.round(recentPerformance.winRate)}%
                    </Text>
                    <Text style={styles.performanceLabel}>Taux de victoire</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Meilleures performances */}
            {bestPerformances && (
              <View style={styles.bestPerformances}>
                <Text style={styles.sectionTitle}>Meilleures Performances</Text>
                <View style={styles.bestPerformanceItem}>
                  <Text style={styles.bestPerformanceLabel}>Meilleure victoire:</Text>
                  <Text style={styles.bestPerformanceValue}>{formatCurrency(bestPerformances.bestWin)}</Text>
                </View>
                {bestPerformances.bestGameType && (
                  <View style={styles.bestPerformanceItem}>
                    <Text style={styles.bestPerformanceLabel}>Meilleur jeu:</Text>
                    <Text style={styles.bestPerformanceValue}>
                      {bestPerformances.bestGameType === 'blackjack' ? 'Blackjack' : 'Machine a Sous'}
                    </Text>
                  </View>
                )}
                {bestPerformances.mostPlayedGame && (
                  <View style={styles.bestPerformanceItem}>
                    <Text style={styles.bestPerformanceLabel}>Jeu le plus joue:</Text>
                    <Text style={styles.bestPerformanceValue}>
                      {bestPerformances.mostPlayedGame === 'blackjack' ? 'Blackjack' : 'Machine a Sous'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.statsTab}>
            {gameStats && (
              <>
                <View style={styles.statsSection}>
                  <Text style={styles.sectionTitle}>Statistiques Globales</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>Total des parties</Text>
                      <Text style={styles.statItemValue}>{gameStats.totalGames}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>Victoires</Text>
                      <Text style={styles.statItemValue}>{gameStats.totalWins}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>Defaites</Text>
                      <Text style={styles.statItemValue}>{gameStats.totalLosses}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>Matchs nuls</Text>
                      <Text style={styles.statItemValue}>{gameStats.totalDraws}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.statsSection}>
                  <Text style={styles.sectionTitle}>Gains et Pertes</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>Total des gains</Text>
                      <Text style={[styles.statItemValue, { color: '#00ff00' }]}>
                        {formatCurrency(gameStats.totalWinnings)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>Total des pertes</Text>
                      <Text style={[styles.statItemValue, { color: '#ff0000' }]}>
                        {formatCurrency(gameStats.totalLossesAmount)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>Gain moyen</Text>
                      <Text style={[styles.statItemValue, { color: '#00ff00' }]}>
                        {formatCurrency(Math.round(gameStats.averageWin || 0))}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>Perte moyenne</Text>
                      <Text style={[styles.statItemValue, { color: '#ff0000' }]}>
                        {formatCurrency(Math.round(gameStats.averageLoss || 0))}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Statistiques par type de jeu */}
                {Object.keys(gameStats.gameTypeStats || {}).length > 0 && (
                  <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Statistiques par Jeu</Text>
                    {Object.entries(gameStats.gameTypeStats).map(([gameType, stats]) => (
                      <View key={gameType} style={styles.gameTypeStats}>
                        <Text style={styles.gameTypeTitle}>
                          {gameType === 'blackjack' ? 'Blackjack' : 'Machine a Sous'}
                        </Text>
                        <View style={styles.gameTypeGrid}>
                          <View style={styles.gameTypeStat}>
                            <Text style={styles.gameTypeStatLabel}>Parties</Text>
                            <Text style={styles.gameTypeStatValue}>{stats.gamesPlayed}</Text>
                          </View>
                          <View style={styles.gameTypeStat}>
                            <Text style={styles.gameTypeStatLabel}>Victoires</Text>
                            <Text style={styles.gameTypeStatValue}>{stats.wins}</Text>
                          </View>
                          <View style={styles.gameTypeStat}>
                            <Text style={styles.gameTypeStatLabel}>Taux de victoire</Text>
                            <Text style={[styles.gameTypeStatValue, { color: getPerformanceColor(stats.winRate || 0) }]}>
                              {Math.round(stats.winRate || 0)}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {activeTab === 'recommendations' && (
          <GameRecommendationComponent />
        )}
      </ScrollView>
    </View>
  );
};

export default GameDashboard; 