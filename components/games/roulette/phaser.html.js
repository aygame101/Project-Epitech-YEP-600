const rouletteHtml = `
  <div style="background: #0F5132; width: 100vw; height: 100vh; position: relative;">
    <!-- Bouton retour en haut à gauche -->
    <div style="position:absolute;top:24px;left:24px;z-index:10;">
      <button id="btn-return" style="background:#FFD700;color:#222;border:none;border-radius:14px;padding:18px 38px;font-weight:bold;cursor:pointer;box-shadow:0 2px 8px #0006;font-size:2rem;"> ᐸ </button>
    </div>
    <!-- Solde et mise en haut à droite -->
    <div style="position:absolute;top:24px;right:24px;z-index:10;display:flex;flex-direction:column;align-items:flex-end;">
      <div id="solde" style="background:#222a;color:#FFD700;padding:16px 32px;border-radius:14px;font-size:2rem;font-family:'Roboto Mono',monospace;margin-bottom:12px;box-shadow:0 2px 8px #0004;">Jetons : -- </div>
      <div id="mise" style="background:#222a;color:#FFD700;padding:16px 32px;border-radius:14px;font-size:1.6rem;font-family:'Roboto Mono',monospace;box-shadow:0 2px 8px #0004;">Mise : 0 </div>
    </div>
    <div style="width: 98vw; max-width: 740px; min-width: 320px; height: 900px; position: absolute; top: 180px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; justify-content: flex-start; align-items: center;">
      <div id="phaser-roulette" style="width:540px;height:540px;"></div>
      <div id="roulette-table" style="margin-top:48px;"></div>
      <!-- Jetons juste sous la table -->
      <div id="chips-bar" style="margin-top:80px;width:100%;display:flex;justify-content:center;gap:40px;"></div>
      <!-- Boutons Spin et Clear sous les jetons -->
      <div style="margin-top:80px;display:flex;justify-content:center;gap:32px;">
        <button id="btn-spin" style="background:#FFD700;color:#222;font-weight:bold;border:none;border-radius:14px;padding:18px 38px;font-size:1.6rem;box-shadow:0 2px 8px #0006;cursor:pointer;">Spin</button>
        <button id="btn-clear" style="background:#eee;color:#222;font-weight:bold;border:none;border-radius:14px;padding:18px 38px;font-size:1.6rem;box-shadow:0 2px 8px rgba(201, 186, 186, 0.8);cursor:pointer;">Clear</button>
      </div>
    </div>
    <script>
      // --- LOGIQUE DU JEU ---
      const NUMBERS = Array.from({length: 37}, (_,i)=>i);
      const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
      const BLACKS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
      const COLUMNS = [
        NUMBERS.filter(n=>n!==0&&n%3===1),
        NUMBERS.filter(n=>n!==0&&n%3===2),
        NUMBERS.filter(n=>n!==0&&n%3===0)
      ];
      const DOZENS = [
        NUMBERS.filter(n=>n>=1&&n<=12),
        NUMBERS.filter(n=>n>=13&&n<=24),
        NUMBERS.filter(n=>n>=25&&n<=36)
      ];
      let solde = 1000; // Valeur par défaut, sera mise à jour par React Native
      let historique = [];
      let bets = [];
      let lastBets = [];
      let selectedChip = 1;
      let mise = 0;

      function addBet(type, value, amount) {
        // Générer un ID unique pour ce pari
        const betId = 'bet-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        bets.push({type, value, amount, id: betId});
        mise = bets.reduce((sum,b)=>sum+(b.amount||0),0);
        
        // Appeler renderBets pour afficher visuellement les paris
        renderBets();
      }
      function renderBets() {
        // D'abord nettoyer les jetons existants
        const existingChips = document.querySelectorAll('.bet-chip');
        for (let i = 0; i < existingChips.length; i++) {
          existingChips[i].parentNode.removeChild(existingChips[i]);
        }
        
        // Réinitialiser également les cases surlignées
        const highlightedCells = document.querySelectorAll('.cell-highlight');
        for (let i = 0; i < highlightedCells.length; i++) {
          highlightedCells[i].classList.remove('cell-highlight');
          highlightedCells[i].style.boxShadow = '';
        }
        
        // Parcourir tous les paris et afficher les jetons
        for (let i = 0; i < bets.length; i++) {
          const bet = bets[i];
          let element = null;
          
          // Trouver l'élément DOM correspondant au pari
          if (bet.type === 'number') {
            element = document.querySelector('.roulette-cell[data-bet-type="number"][data-value="' + bet.value + '"]');
          } else if (['red', 'black', 'even', 'odd', 'low', 'high'].includes(bet.type)) {
            element = document.querySelector('.roulette-cell[data-bet-type="' + bet.type + '"]');
          } else if (bet.type === 'dozen' || bet.type === 'column') {
            element = document.querySelector('.roulette-cell[data-bet-type="' + bet.type + '"][data-value="' + bet.value + '"]');
          }
          
          if (element) {
            // Ajouter une classe pour le positionnement des jetons
            if (!element.classList.contains('bet-container')) {
              element.classList.add('bet-container');
              element.style.position = 'relative';
            }
            
            // Ajouter un effet de surbrillance à la case
            element.classList.add('cell-highlight');
            element.style.boxShadow = '0 0 8px 2px #fcfcf9ff';
            element.style.transform = 'scale(1.02)';
            element.style.transition = 'all 0.3s ease';
            element.style.zIndex = '5';
            
            // Créer un jeton visuel
            const chip = document.createElement('div');
            chip.id = bet.id;
            chip.className = 'bet-chip';
            chip.dataset.betId = bet.id;
            
            // Positionner le jeton au centre de l'élément
            chip.style.position = 'absolute';
            chip.style.left = '50%';
            chip.style.top = '50%';
            chip.style.transform = 'translate(-50%, -50%)';
            
            // Apparence du jeton
            chip.style.width = '36px';
            chip.style.height = '36px';
            chip.style.borderRadius = '50%';
            chip.style.backgroundColor =
              bet.amount === 1 ? '#fff' :
              bet.amount === 5 ? '#f44336' :
              bet.amount === 10 ? '#2196f3' :
              bet.amount === 25 ? '#4caf50' : '#FFD700';
            chip.style.color = (bet.amount === 1) ? '#222' : '#fff';
            chip.style.display = 'flex';
            chip.style.alignItems = 'center';
            chip.style.justifyContent = 'center';
            chip.style.fontWeight = 'bold';
            chip.style.fontSize = '0.8rem';
            chip.style.zIndex = '20';
            chip.style.border = '2px solid #fff';
            chip.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            chip.textContent = bet.amount;
            
            element.appendChild(chip);
          }
        }
      }
      
      function clearBets() {
        bets = [];
        mise = 0;
        
        // Nettoyer les jetons visuels sur la table uniquement
        const betChips = document.querySelectorAll('.bet-chip');
        for (let i = 0; i < betChips.length; i++) {
          betChips[i].parentNode.removeChild(betChips[i]);
        }
        
        // Réinitialiser également les classes de conteneurs de paris
        const betContainers = document.querySelectorAll('.bet-container');
        for (let i = 0; i < betContainers.length; i++) {
          betContainers[i].classList.remove('bet-container');
          betContainers[i].style.position = '';
        }
        
        // Réinitialiser les cases surlignées
        const highlightedCells = document.querySelectorAll('.cell-highlight');
        for (let i = 0; i < highlightedCells.length; i++) {
          highlightedCells[i].classList.remove('cell-highlight');
          highlightedCells[i].style.boxShadow = '';
          highlightedCells[i].style.transform = '';
          highlightedCells[i].style.transition = '';
          highlightedCells[i].style.zIndex = '';
        }
      }
      function repeatBets() {
        if(lastBets.length) {
          bets = JSON.parse(JSON.stringify(lastBets));
          // Générer de nouveaux IDs pour les paris répétés
          for (let i = 0; i < bets.length; i++) {
            bets[i].id = 'bet-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          }
          mise = bets.reduce((sum,b)=>sum+(b.amount||0),0);
          renderBets();
        }
      }
      function setSolde(newSolde) {
        solde = newSolde;
      }
      function setSelectedChip(chip) {
        selectedChip = chip;
      }
function spinRoulette() {
  // Tirage aléatoire du numéro gagnant
  const winningNumber = Math.floor(Math.random() * 37);

  // Snapshot de la mise et des paris AVANT reset
  const wager = mise;
  const betsCopy = JSON.parse(JSON.stringify(bets));

  // Historique court
  historique.push(winningNumber);
  if (historique.length > 20) historique = historique.slice(-20);

  // Calcul du gain
  const gain = calcGain(winningNumber);

  // Mise à jour du solde local pour l’affichage WebView
  solde -= wager;
  solde += gain;

  // Sauvegarde des mises pour "Répéter"
  lastBets = JSON.parse(JSON.stringify(bets));

  // Nettoyage visuel + état
  clearBets();

  // ✅ Envoi du résultat à React Native (pas de write direct Firestore ici)
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      result: {
        game: 'roulette',
        wager: Number(wager) || 0,
        payout: Number(gain) || 0,
        winningNumber,
        bets: betsCopy
      }
    }));
  }

  // Retour programmatique si jamais utilisé par d'autres fonctions internes
  return { winningNumber, gain, solde };
}

      function calcGain(num) {
        let gain = 0;
        bets.forEach(b=>{
          if(b.type==='number'&&b.value==num) gain += b.amount*36;
          else if(b.type==='red'&&REDS.includes(num)) gain += b.amount*2;
          else if(b.type==='black'&&BLACKS.includes(num)) gain += b.amount*2;
          else if(b.type==='even'&&num!==0&&num%2===0) gain += b.amount*2;
          else if(b.type==='odd'&&num%2===1) gain += b.amount*2;
          else if(b.type==='column'&&COLUMNS[b.value-1].includes(num)) gain += b.amount*3;
          else if(b.type==='dozen'&&DOZENS[b.value-1].includes(num)) gain += b.amount*3;
          else if(b.type==='low'&&num>=1&&num<=18) gain += b.amount*2;
          else if(b.type==='high'&&num>=19&&num<=36) gain += b.amount*2;
        });
        return gain;
      }
      window.addBet = addBet;
      window.spinRoulette = spinRoulette;
      window.clearBets = clearBets;
      window.repeatBets = repeatBets;
      window.setSolde = setSolde;
      window.setSelectedChip = setSelectedChip;
    </script>
    <script>
      // --- SCRIPT INTERFACE ---
      (function() {
        // Variables globales pour l'animation
        let gameInstance = null;
        let isSpinning = false;
        let pendingResult = null;
        // Variables de rotation minimales
        let wheelRotation = 0;
        let ballRotation = 0;
        // Vitesses de rotation
        let wheelSpeed = 0;
        let ballSpeed = 0;
        // Directions de rotation (1 = sens horaire, -1 = sens anti-horaire)
        let wheelDirection = 1;
        let ballDirection = -1; // Direction opposée à la roue
        // Variable pour stocker l'angle final où la balle doit s'arrêter
        let targetBallAngle = 0;
        
        // Fonction pour afficher la fenêtre de résultat
        function displayResults(result) {
          // Déterminer la couleur du numéro
          const num = result.winningNumber;
          let color = "green";
          if ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num)) {
            color = "red";
          } else if ([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(num)) {
            color = "black";
          }
          
          // Créer la fenêtre de résultat
          const resultDiv = document.createElement("div");
          resultDiv.className = "result-popup";
          
          // Créer le contenu
          const contentDiv = document.createElement("div");
          contentDiv.className = "result-content";
          
          // Titre
          const title = document.createElement("h3");
          title.textContent = "Résultat";
          title.style.fontSize = "42px";
          title.style.marginBottom = "30px";
          title.style.fontWeight = "bold";
          title.style.color = "#333";
          contentDiv.appendChild(title);
          
          // Numéro
          const numberP = document.createElement("p");
          numberP.className = "result-number";
          numberP.textContent = "Numéro : ";
          numberP.style.fontWeight = "bold";
          
          const numSpan = document.createElement("span");
          numSpan.className = "number " + color;
          numSpan.textContent = num;
          numberP.appendChild(numSpan);
          contentDiv.appendChild(numberP);
          
          // Gain
          const gainP = document.createElement("p");
          gainP.className = "result-gain";
          gainP.textContent = "Gain : " + result.gain + " ";
          gainP.style.color = result.gain > 0 ? "green" : "red";
          contentDiv.appendChild(gainP);
          
          // Bouton fermer
          const closeBtn = document.createElement("button");
          closeBtn.id = "btn-result-close";
          closeBtn.textContent = "Fermer";
          closeBtn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
          closeBtn.style.transition = "all 0.2s ease";
          contentDiv.appendChild(closeBtn);
          
          // Ajouter un effet hover au bouton
          closeBtn.addEventListener("mouseover", function() {
            closeBtn.style.transform = "scale(1.05)";
            closeBtn.style.boxShadow = "0 6px 12px rgba(0,0,0,0.4)";
          });
          closeBtn.addEventListener("mouseout", function() {
            closeBtn.style.transform = "scale(1)";
            closeBtn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
          });
          
          // Assembler
          resultDiv.appendChild(contentDiv);
          document.body.appendChild(resultDiv);
          
          // Ajouter les styles CSS
          const styleElem = document.createElement("style");
          styleElem.textContent = 
            ".result-popup {" +
            "  position: fixed;" +
            "  top: 0;" +
            "  left: 0;" +
            "  width: 100%;" +
            "  height: 100%;" +
            "  background: rgba(0,0,0,0.7);" +
            "  display: flex;" +
            "  justify-content: center;" +
            "  align-items: center;" +
            "  z-index: 1000;" +
            "}" +
            ".result-content {" +
            "  background: white;" +
            "  padding: 40px;" +
            "  border-radius: 20px;" +
            "  text-align: center;" +
            "  box-shadow: 0 0 30px rgba(0,0,0,0.7);" +
            "  min-width: 400px;" +
            "  max-width: 80%;" +
            "}" +
            ".result-number {" +
            "  font-size: 36px;" +
            "  margin: 35px 0;" +
            "}" +
            ".number {" +
            "  display: inline-block;" +
            "  width: 70px;" +
            "  height: 70px;" +
            "  line-height: 70px;" +
            "  border-radius: 50%;" +
            "  color: white;" +
            "  font-weight: bold;" +
            "  font-size: 30px;" +
            "}" +
            ".number.red { background-color: #C02C29; }" +
            ".number.black { background-color: #222; }" +
            ".number.green { background-color: #008000; }" +
            ".result-gain {" +
            "  font-size: 32px;" +
            "  margin-bottom: 40px;" +
            "  font-weight: bold;" +
            "}" +
            "#btn-result-close {" +
            "  padding: 15px 35px;" +
            "  background: #1E88E5;" +
            "  color: white;" +
            "  border: none;" +
            "  border-radius: 8px;" +
            "  cursor: pointer;" +
            "  font-size: 20px;" +
            "  font-weight: bold;" +
            "}";
          document.head.appendChild(styleElem);
          
          // Gérer la fermeture de la fenêtre
          document.getElementById("btn-result-close").addEventListener("click", function() {
            document.body.removeChild(resultDiv);
            document.head.removeChild(styleElem);
          });
        }
        
        // Fonction pour indiquer visuellement qu'il faut placer une mise
        function showNoBetError() {
          // 1. Récupérer le bouton Spin
          const spinButton = document.getElementById('btn-spin');
          if (!spinButton) return;
          
          // 2. Sauvegarder l'apparence originale du bouton
          const originalBackground = spinButton.style.background;
          const originalTransform = spinButton.style.transform;
          const originalTransition = spinButton.style.transition;
          
          // 3. Créer l'élément message
          const messageElement = document.createElement('div');
          messageElement.textContent = "Placez une mise";
          messageElement.style.position = "absolute";
          messageElement.style.bottom = "130px"; // Au-dessus du bouton Spin
          messageElement.style.left = "50%";
          messageElement.style.transform = "translateX(-50%)";
          messageElement.style.background = "rgba(220, 53, 69, 0.9)"; // Rouge
          messageElement.style.color = "#fff";
          messageElement.style.padding = "8px 16px";
          messageElement.style.borderRadius = "16px";
          messageElement.style.fontSize = "16px";
          messageElement.style.fontWeight = "bold";
          messageElement.style.zIndex = "1000";
          messageElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
          messageElement.style.opacity = "0"; // Commence invisible
          messageElement.style.transition = "opacity 0.3s ease";
          
          // 4. Ajouter le message au DOM
          document.body.appendChild(messageElement);
          
          // 5. Effet sur le bouton : vibration et changement de couleur
          spinButton.style.background = "#dc3545"; // Rouge
          spinButton.style.transition = "transform 0.1s ease";
          
          // Effet de vibration
          setTimeout(() => { spinButton.style.transform = "translateX(-3px)"; }, 0);
          setTimeout(() => { spinButton.style.transform = "translateX(3px)"; }, 100);
          setTimeout(() => { spinButton.style.transform = "translateX(-2px)"; }, 200);
          setTimeout(() => { spinButton.style.transform = "translateX(0)"; }, 300);
          
          // 6. Afficher le message avec fondu
          setTimeout(() => { messageElement.style.opacity = "1"; }, 100);
          
          // 7. Restaurer l'apparence du bouton après un délai
          setTimeout(() => {
            spinButton.style.background = originalBackground;
            spinButton.style.transform = originalTransform;
            spinButton.style.transition = originalTransition;
          }, 500);
          
          // 8. Faire disparaître et supprimer le message après un délai
          setTimeout(() => {
            messageElement.style.opacity = "0";
            setTimeout(() => {
              if (document.body.contains(messageElement)) {
                document.body.removeChild(messageElement);
              }
            }, 300);
          }, 2000);
        }
        
        function drawRoulettePhaser() {
          const numbers = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
          const reds = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3];
          const config = {
            type: Phaser.AUTO,
            width: 540,
            height: 540,
            parent: 'phaser-roulette',
            backgroundColor: '#0F5132',
            scene: {
              create: function () {
                const cx = 270, cy = 270, rOuter = 245, rInner = 140;
                
                // Étape 2.1 : Création du conteneur pour la roue uniquement
                this.wheelContainer = this.add.container(cx, cy);
                
                // Référencer le conteneur dans la variable globale
                wheelContainer = this.wheelContainer;
                
                // Créer l'objet graphique habituel
                // Créer l'objet graphique pour la roue
                this.graphics = this.add.graphics();
                
                // Étape 2.2 : Ajouter l'objet graphique au conteneur
                this.wheelContainer.add(this.graphics);
                
                // Anneau doré extérieur - Coordonnées relatives (0,0) au lieu de (cx,cy)
                this.graphics.lineStyle(7, 0xFFD700, 1);
                this.graphics.beginPath();
                this.graphics.arc(0, 0, rOuter + 2, 0, 2 * Math.PI);
                this.graphics.closePath();
                this.graphics.strokePath();

                // Traits dorés entre chaque case - Coordonnées relatives
                for (let i = 0; i < 37; i++) {
                  let angle = ((i/37)*2*Math.PI) - Math.PI/2;
                  let x1 = Math.cos(angle) * (rOuter + 2);
                  let y1 = Math.sin(angle) * (rOuter + 2);
                  let x2 = Math.cos(angle) * 78;
                  let y2 = Math.sin(angle) * 78;
                  this.graphics.lineStyle(4, 0xFFD700, 1);
                  this.graphics.beginPath();
                  this.graphics.moveTo(x1, y1);
                  this.graphics.lineTo(x2, y2);
                  this.graphics.closePath();
                  this.graphics.strokePath();
                }

                // Cases avec espace doré entre chaque
                for (let i = 0; i < 37; i++) {
                  let a0 = ((i/37)*2*Math.PI) - Math.PI/2;
                  let a1 = (((i+1)/37)*2*Math.PI) - Math.PI/2;
                  let num = numbers[i];
                  // Espace doré - Coordonnées relatives
                  let aGold0 = a0;
                  let aGold1 = a0 + (a1-a0)*0.08;
                  this.graphics.beginPath();
                  this.graphics.arc(0, 0, rOuter, aGold0, aGold1, false);
                  this.graphics.arc(0, 0, rInner, aGold1, aGold0, true);
                  this.graphics.closePath();
                  this.graphics.fillStyle(0xFFD700, 1);
                  this.graphics.fillPath();

                  // Case principale - Coordonnées relatives
                  let aMain0 = aGold1;
                  let aMain1 = a1;
                  let color = num === 0 ? 0x2ecc40 : reds.includes(num) ? 0xC0392B : 0x222222;
                  this.graphics.beginPath();
                  this.graphics.arc(0, 0, rOuter, aMain0, aMain1, false);
                  this.graphics.arc(0, 0, rInner, aMain1, aMain0, true);
                  this.graphics.closePath();
                  this.graphics.fillStyle(color, 1);
                  this.graphics.fillPath();

                  // Numéro - Coordonnées relatives
                  let angleText = (a0 + a1) / 2;
                  let rText = rOuter - 40;
                  let xText = Math.cos(angleText) * rText;
                  let yText = Math.sin(angleText) * rText;
                  // Créer le texte et l'ajouter au conteneur
                  let numText = this.add.text(xText, yText, num.toString(), {
                    font: 'bold 24px Arial',
                    color: '#fff',
                  }).setOrigin(0.5);
                  // Ajouter le texte au conteneur
                  this.wheelContainer.add(numText);
                }

                // Anneau central doré
                this.graphics.lineStyle(16, 0xFFD700, 1);
                this.graphics.beginPath();
                this.graphics.arc(0, 0, 78, 0, 2 * Math.PI);
                this.graphics.closePath();
                this.graphics.strokePath();

                // Disque marron (effet bois simplifié)
                this.graphics.fillStyle(0xA0522D, 1);
                this.graphics.fillCircle(0, 0, 70);

                // Rayons dorés au centre
                for (let i = 0; i < 6; i++) {
                  let angle = (i/6)*2*Math.PI;
                  let x1 = Math.cos(angle) * 24;
                  let y1 = Math.sin(angle) * 24;
                  let x2 = Math.cos(angle) * 62;
                  let y2 = Math.sin(angle) * 62;
                  this.graphics.lineStyle(4, 0xFFD700, 1);
                  this.graphics.beginPath();
                  this.graphics.moveTo(x1, y1);
                  this.graphics.lineTo(x2, y2);
                  this.graphics.closePath();
                  this.graphics.strokePath();
                }

                // Petit disque doré au centre
                this.graphics.fillStyle(0xFFD700, 1);
                this.graphics.fillCircle(0, 0, 24);

                // Disque foncé au centre
                this.graphics.fillStyle(0x222222, 1);
                this.graphics.fillCircle(0, 0, 14);

                // Ajouter le graphics au conteneur de la roue
                this.wheelContainer.add(this.graphics);

                // Création du conteneur pour la balle
                this.ballContainer = this.add.container(cx, cy);
                
                // Créer un objet graphique séparé pour la balle
                this.ballGraphics = this.add.graphics();
                
                // Balle blanche
                let ballIndex = 0; // 0 = case 0
                let aBall = ((ballIndex/37)*2*Math.PI) - Math.PI/2;
                let rBall = (rOuter + rInner) / 2;
                let xBall = Math.cos(aBall) * rBall;
                let yBall = Math.sin(aBall) * rBall + 20;
                this.ballGraphics.fillStyle(0xffffff, 1);
                this.ballGraphics.fillCircle(xBall, yBall, 16);
                this.ballGraphics.lineStyle(2, 0xcccccc, 1);
                this.ballGraphics.strokeCircle(xBall, yBall, 16);
                
                // Ajouter le graphics de la balle à son conteneur
                this.ballContainer.add(this.ballGraphics);
              },
              
              // Ajouter la méthode update pour l'animation
              update: function() {
                if (isSpinning) {
                  // Mettre à jour les angles de rotation
                  wheelRotation += wheelSpeed * wheelDirection;
                  ballRotation += ballSpeed * ballDirection;
                  
                  // Appliquer la rotation aux conteneurs
                  if (this.wheelContainer) {
                    this.wheelContainer.rotation = wheelRotation;
                  }
                  
                  if (this.ballContainer) {
                    this.ballContainer.rotation = ballRotation;
                  }
                  
                  // Ralentissement progressif
                  if (wheelSpeed > 0.001) {
                    wheelSpeed *= 0.995; // Ralentissement de la roue
                    
                    // Ralentir la balle plus lentement que la roue
                    ballSpeed *= 0.997;
                  } else {
                    // Roue arrêtée, mais la balle continue de tourner
                    wheelSpeed = 0;
                    
                    // Faire tourner la balle jusqu'à ce qu'elle atteigne presque l'angle cible
                    if (ballSpeed > 0.0005) { // Seuil plus bas pour un arrêt plus précis
                      // Obtenir l'angle actuel et l'angle cible, normalisés entre 0 et 2π
                      const currentAngle = ((ballRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                      const targetAngle = ((targetBallAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                      
                      // Calculer les distances dans les deux sens (horaire et anti-horaire)
                      const distanceClockwise = (targetAngle >= currentAngle) 
                          ? targetAngle - currentAngle 
                          : 2 * Math.PI - (currentAngle - targetAngle);
                      
                      const distanceCounterClockwise = (currentAngle >= targetAngle) 
                          ? currentAngle - targetAngle 
                          : 2 * Math.PI - (targetAngle - currentAngle);
                      
                      // Choisir le chemin le plus court
                      const shortestDistance = Math.min(distanceClockwise, distanceCounterClockwise);
                      ballDirection = (distanceClockwise <= distanceCounterClockwise) ? 1 : -1;
                      
                      // Adapter le ralentissement selon la distance
                      if (shortestDistance < 0.1) {
                        ballSpeed *= 0.90; // Très proche
                      } else if (shortestDistance < 0.3) {
                        ballSpeed *= 0.94; // Proche
                      } else if (shortestDistance < 0.8) {
                        ballSpeed *= 0.96; // Distance moyenne
                      } else {
                        ballSpeed *= 0.98; // Loin
                      }
                    } else {
                      // La balle est presque arrêtée, aligner exactement sur l'angle cible
                      ballSpeed = 0;
                      
                      // Arrêter la balle exactement à l'angle cible final (valeur exacte)
                      this.ballContainer.rotation = targetBallAngle;
                      
                      // Arrêter l'animation et afficher les résultats
                      if (isSpinning && pendingResult !== null) {
                        isSpinning = false;
                        displayResults(pendingResult);
                        pendingResult = null;
                      }
                    }
                  }
                }
              }
            }
          };
          gameInstance = new Phaser.Game(config);
        }
        function renderRouletteTable() {
          const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
          const blacks = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

          // Bloc principal
          let html = '<div style="display:flex;flex-direction:row;align-items:flex-start;justify-content:center;">';
          // 0 à gauche
          html += '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin-right:12px;">';
          html += '<div style="width:62px;height:144px;background:#2ecc40;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.8rem;border:2px solid #FFD700;">0</div>';
          html += '</div>';

          // Grille des numéros + "2 to 1"
          html += '<div>';
          html += '<div style="display:flex;flex-direction:row;">';
          html += '<div style="display:grid;grid-template-columns:repeat(12,62px);grid-template-rows:repeat(3,48px);gap:6px;">';
          // Numéros
          for(let row=0;row<3;row++) {
            for(let col=1;col<=12;col++) {
              let n = col + row*12;
              let color = reds.includes(n) ? '#C0392B' : blacks.includes(n) ? '#222' : '#fff';
              let textColor = (color==='#fff') ? '#222' : '#fff';
              html += '<div class="roulette-cell" data-bet-type="number" data-value="' + n + '" style="width:62px;height:48px;background:' + color + ';color:' + textColor + ';border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.4rem;border:2px solid #FFD700;cursor:pointer;">' + n + '</div>';
            }
          }
          html += '</div>';
          // "2 to 1" à droite de chaque ligne
          html += '<div style="display:flex;flex-direction:column;gap:6px;margin-left:6px;">';
          for(let i=0;i<3;i++) {
            html += '<div class="roulette-cell" data-bet-type="column" data-value="' + (i+1) + '" style="width:62px;height:48px;background:#FFD700;color:#222;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1rem;border:2px solid #FFD700;cursor:pointer;">2 to 1</div>';
          }
          html += '</div>';
          html += '</div>';

          // Ligne des douzaines alignée sous les bonnes colonnes
          html += '<div style="display:flex;flex-direction:row;margin-top:8px;">';
          html += '<div style="width:62px;"></div>'; // espace sous le zéro
          html += '<div style="display:flex;flex-direction:row;">';
          html += '<div style="width:744px;display:flex;">';
          html += '<div class="roulette-cell" data-bet-type="dozen" data-value="1" style="width:248px;height:48px;background:#FFD700;color:#222;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1rem;border:2px solid #FFD700;cursor:pointer;">1st 12</div>';
          html += '<div class="roulette-cell" data-bet-type="dozen" data-value="2" style="width:248px;height:48px;background:#FFD700;color:#222;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1rem;border:2px solid #FFD700;cursor:pointer;">2nd 12</div>';
          html += '<div class="roulette-cell" data-bet-type="dozen" data-value="3" style="width:248px;height:48px;background:#FFD700;color:#222;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1rem;border:2px solid #FFD700;cursor:pointer;">3rd 12</div>';
          html += '</div>';
          html += '</div>';
          html += '<div style="width:62px;"></div>'; // espace sous les "2 to 1"
          html += '</div>';

          // Ligne des mises extérieures
          html += '<div style="display:flex;flex-direction:row;justify-content:center;margin-top:10px;">';
          html += '<div class="roulette-cell" data-bet-type="low" style="width:124px;height:48px;background:#fff;color:#222;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1rem;border:2px solid #FFD700;cursor:pointer;">1 to 18</div>';
          html += '<div class="roulette-cell" data-bet-type="even" style="width:92px;height:48px;background:#fff;color:#222;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1rem;border:2px solid #FFD700;cursor:pointer;">EVEN</div>';
          html += '<div class="roulette-cell" data-bet-type="red" style="width:92px;height:48px;background:#C0392B;color:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.3rem;border:2px solid #FFD700;cursor:pointer;">&#9670;</div>';
          html += '<div class="roulette-cell" data-bet-type="black" style="width:92px;height:48px;background:#222;color:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.3rem;border:2px solid #FFD700;cursor:pointer;">&#9670;</div>';
          html += '<div class="roulette-cell" data-bet-type="odd" style="width:92px;height:48px;background:#fff;color:#222;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1rem;border:2px solid #FFD700;cursor:pointer;">ODD</div>';
          html += '<div class="roulette-cell" data-bet-type="high" style="width:124px;height:48px;background:#fff;color:#222;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1rem;border:2px solid #FFD700;cursor:pointer;">19 to 36</div>';
          html += '</div>';

          html += '</div>'; // fin du bloc principal
          document.getElementById('roulette-table').innerHTML = html;
        }
        const CHIPS = [1,5,10,25,100];

        function renderChipsBar() {
          document.getElementById('chips-bar').innerHTML = CHIPS.map(v =>
            '<div class="chip" style="width:80px;height:80px;border-radius:50%;background:'+(v===1?'#fff':v===5?'#f44336':v===10?'#2196f3':v===25?'#4caf50':'#FFD700')+';color:'+(v===1?'#222':'#fff')+';display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:2rem;cursor:pointer;border:4px solid #FFD700;box-shadow:0 2px 12px #0006;'+(selectedChip===v?'transform:scale(1.15);border-color:#fff;':'')+'" data-value="'+v+'">'+v+'</div>'
          ).join('');
        }
        function renderSoldeMise() {
          document.getElementById('solde').textContent = 'Jetons : ' + solde + ' ';
          document.getElementById('mise').textContent = 'Mise : ' + mise + ' ';
        }
        document.addEventListener('DOMContentLoaded', () => {
          renderChipsBar();
          renderSoldeMise();
          document.getElementById('chips-bar').addEventListener('click', e => {
            let v = parseInt(e.target.dataset.value);
            if (!isNaN(v) && CHIPS.includes(v)) {
              selectedChip = v;
              renderChipsBar();
            }
          });
          // Bouton retour : envoie le message à React Native WebView
          const btnReturn = document.getElementById('btn-return');
          if (btnReturn) {
            btnReturn.addEventListener('click', () => {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'goBack' }));
              } else {
                window.history.back();
              }
            });
          }
          // Ajout : gestion du clic sur les cases de la table
          document.getElementById('roulette-table').addEventListener('click', function(e) {
            const cell = e.target.closest('.roulette-cell');
            if (cell) {
              const betType = cell.dataset.betType;
              const value = cell.dataset.value ? isNaN(cell.dataset.value) ? cell.dataset.value : parseInt(cell.dataset.value) : undefined;
              if (betType) {
                addBet(betType, value, selectedChip);
                renderSoldeMise();
              }
            }
          });
          // Bouton Spin
          document.getElementById('btn-spin').addEventListener('click', () => {
            // Vérifier si la roulette n'est pas déjà en rotation ET si une mise a été placée
            if (!isSpinning && mise > 0) {
              const result = spinRoulette();
              renderSoldeMise();
              
              // Initialiser l'animation
              isSpinning = true;
              wheelSpeed = 0.1; // Vitesse initiale de rotation de la roue
              ballSpeed = 0.15; // Vitesse initiale de rotation de la balle (plus rapide)
              pendingResult = result; // Stocker le résultat pour l'afficher après l'animation
              
              // Calculer l'angle cible pour le numéro gagnant
              const numbers = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
              const winningIndex = numbers.indexOf(result.winningNumber);
              
              if (winningIndex !== -1) {
                // Position angulaire du numéro gagnant sur la roue
                // Correspondance exacte avec le dessin du secteur dans drawRoulettePhaser
                const sectorAngle = 2 * Math.PI / 37; // Angle d'un secteur complet
                const startAngle = ((winningIndex/37)*2*Math.PI) - Math.PI/2; // Angle de début du secteur
                const endAngle = (((winningIndex+1)/37)*2*Math.PI) - Math.PI/2; // Angle de fin du secteur
                
                // Le secteur a une bande dorée au début (8% de l'arc)
                const goldWidth = (endAngle - startAngle) * 0.08;
                const mainStartAngle = startAngle + goldWidth; // Début de la partie principale
                
                // Viser exactement le centre de la partie principale du secteur
                targetBallAngle = mainStartAngle + (endAngle - mainStartAngle) * 0.5;
                
                // Ajouter plusieurs tours complets pour une animation plus longue
                targetBallAngle += 4 * Math.PI;
              } else {
                // Fallback en cas d'erreur
                targetBallAngle = 0;
              }
            }
          });
          // Bouton Clear
          document.getElementById('btn-clear').addEventListener('click', () => {
            clearBets();
            renderSoldeMise();
          });
        });
        function loadPhaserAndDraw() {
          if (typeof Phaser === 'undefined') {
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.js';
            script.onload = function() {
              drawRoulettePhaser();
              renderRouletteTable();
            };
            document.body.appendChild(script);
          } else {
            drawRoulettePhaser();
            renderRouletteTable();
          }
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', loadPhaserAndDraw);
        } else {
          loadPhaserAndDraw();
        }
        
        // Initialisation du solde depuis React Native
        window.addEventListener('load', function() {
          console.log('Initial balance from React Native:', window.initialBalance);
          if (typeof window.initialBalance !== 'undefined') {
            setSolde(window.initialBalance);
            renderSoldeMise();
          }
        });
      })();
    </script>
  </div>
`
export default rouletteHtml;