// components/styles/GameDashboard.styles.js
// Styles simples pour le composant GameDashboard

import { StyleSheet } from 'react-native';

export const GameDashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#111111',
    padding: 20,
    paddingTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  balanceContainer: {
    backgroundColor: '#222222',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    marginHorizontal: 20,
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#333333',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overviewTab: {
    paddingBottom: 20,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
    color: '#ffffff',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
  },
  recentPerformance: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
  },
  bestPerformances: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
  },
  bestPerformanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  bestPerformanceLabel: {
    fontSize: 14,
    color: '#cccccc',
  },
  bestPerformanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsTab: {
    paddingBottom: 20,
  },
  statsSection: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#222222',
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 8,
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gameTypeStats: {
    backgroundColor: '#222222',
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  gameTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  gameTypeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameTypeStat: {
    alignItems: 'center',
    flex: 1,
  },
  gameTypeStatLabel: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 4,
  },
  gameTypeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 100,
  },

  backButtonContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  safeContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
});