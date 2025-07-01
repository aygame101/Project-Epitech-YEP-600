export class ReactNativeBridge {
  constructor() {
    this.listeners = new Map();
    this.setupMessageListener();
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      try {
        const message = typeof event.data === 'string' 
          ? JSON.parse(event.data) 
          : event.data;
        
        this.handleMessage(message);
      } catch (error) {
        console.error('Erreur parsing message React Native:', error);
      }
    });

    // Support pour les anciennes versions
    document.addEventListener('message', (event) => {
      this.setupMessageListener();
    });
  }

  handleMessage(message) {
    const { action, data } = message;
    
    if (this.listeners.has(action)) {
      this.listeners.get(action).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur callback ${action}:`, error);
        }
      });
    }
  }

  // Enregistrer un listener pour une action
  on(action, callback) {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, []);
    }
    this.listeners.get(action).push(callback);
  }

  // Supprimer un listener
  off(action, callback) {
    if (this.listeners.has(action)) {
      const callbacks = this.listeners.get(action);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Envoyer un message à React Native
  postMessage(action, data = {}) {
    const message = {
      action,
      data,
      timestamp: Date.now(),
      source: 'phaser-game'
    };

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } else if (window.postMessage) {
      window.postMessage(message, '*');
    } else {
      console.warn('Aucune méthode de communication disponible');
    }
  }

  // Méthodes spécifiques au jeu
  sendGameEvent(eventType, eventData) {
    this.postMessage('gameEvent', {
      type: eventType,
      ...eventData
    });
  }

  sendPlayerStats(stats) {
    this.postMessage('playerStats', stats);
  }

  sendError(error) {
    this.postMessage('gameError', {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });
  }
}

// Instance globale
export const bridge = new ReactNativeBridge();