// components/styles/GameRecommendationComponent.styles.js
// Styles simples pour le composant GameRecommendationComponent

import { StyleSheet } from 'react-native';

export const GameRecommendationComponentStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  header: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginRight: 8,
  },
  levelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  globalRecommendation: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  globalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  globalText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  gamesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  gameCard: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedGameCard: {
    borderColor: '#ffffff',
    backgroundColor: '#222222',
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  gameIcon: {
    fontSize: 24,
    marginRight: 12,
    color: '#ffffff',
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  suitabilityContainer: {
    alignItems: 'flex-end',
  },
  suitabilityLabel: {
    fontSize: 12,
    color: '#cccccc',
  },
  suitabilityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gameDescription: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 16,
    lineHeight: 20,
  },
  gameDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#aaaaaa',
  },
  detailValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: '#111111',
    borderRadius: 6,
    padding: 16,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 6,
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#333333',
    borderRadius: 6,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 50,
  },
}); 