import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export default function SlotGameWebView() {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    (async () => {
      // ASSET LOADING
      const modules = [
        require('../../assets/games/slot/background.png'),
        require('../../assets/games/slot/slot-frame.png'),
        require('../../assets/games/slot/spin-button.png'),
        require('../../assets/games/slot/symbols/bar.png'),
        require('../../assets/games/slot/symbols/bell.png'),
        require('../../assets/games/slot/symbols/cherry.png'),
        require('../../assets/games/slot/symbols/diamond.png'),
        require('../../assets/games/slot/symbols/lemon.png'),
        require('../../assets/games/slot/symbols/orange.png'),
        require('../../assets/games/slot/symbols/plum.png'),
        require('../../assets/games/slot/symbols/seven.png'),
      ];
      const assets = await Promise.all(modules.map(m => Asset.fromModule(m).downloadAsync()));

      // BASE64 CONVERSION
      const b64s = await Promise.all(assets.map(a => {
        if (!a.localUri) throw new Error('Asset.localUri is null');
        return FileSystem.readAsStringAsync(a.localUri, { encoding: FileSystem.EncodingType.Base64 });
      }));

      // DATA URI PREP
      const [bg64, frame64, spin64, ...sym64] = b64s;
      const symbols = ['bar','bell','cherry','diamond','lemon','orange','plum','seven'];
      const symbolDataURIs = {};
      symbols.forEach((key, i) => { symbolDataURIs[key] = `data:image/png;base64,${sym64[i]}`; });

      // HTML GENERATION
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
  <style>body,html{margin:0;padding:0;overflow:hidden;background:#000}#game-container{width:100%;height:100%}</style>
</head>
<body>
  <div id="game-container"></div>
  <script>
    // PARAMS
    const symbolDataURIs = ${JSON.stringify(symbolDataURIs)};
    const symbols = Object.keys(symbolDataURIs);
    const START_TOKENS = 100;
    const BET_AMOUNT = 1;
    // Si vous souhaitez différents montants par symbole, vous pouvez aussi définir paytable par symbole et count
    const PAYTABLE = { 3:10, 4:20, 5:50 };

    // Définition des lignes de paiement (extraites du site et de l'image) :
    // Chaque pattern est un tableau de 5 indices de ligne (0=haut,1=milieu,2=bas).
    const PAYLINES = [
      // 1–7 (déjà en place)
      [0,0,0,0,0], // 1: ligne haute
      [1,1,1,1,1], // 2: ligne milieu
      [2,2,2,2,2], // 3: ligne basse
      [2,1,2,1,2], // 4: zig-zag bas–milieu–bas–milieu–bas
      [0,1,0,1,0], // 5: zig-zag haut–milieu–haut–milieu–haut
      [0,1,2,1,0], // 6: V inversé haut–milieu–bas–milieu–haut
      [2,1,0,1,2], // 7: V bas–milieu–haut–milieu–bas

      // 8–10: lignes qui descendent puis remontent
      [0,0,1,1,0], // 8: 2×haut → 2×milieu → haut
      [2,2,1,1,2], // 9: 2×bas  → 2×milieu → bas
      [0,1,1,1,0], // 10: haut → 3×milieu → haut

      // 11–20: « escaliers » et « coins »
      [1,0,0,0,1],  // 11: milieu → 3×haut → milieu
      [1,2,2,2,1],  // 12: milieu → 3×bas  → milieu
      [0,1,2,2,2],  // 13: haut → milieu → 3×bas
      [2,1,0,0,0],  // 14: bas  → milieu → 3×haut
      [0,2,1,2,0],  // 15: haut → bas  → milieu → bas  → haut
      [2,0,1,0,2],  // 16: bas  → haut → milieu → haut → bas
      [1,1,0,1,1],  // 17: milieu → milieu → haut → milieu → milieu
      [1,1,2,1,1],  // 18: milieu → milieu → bas  → milieu → milieu
      [0,1,1,0,0],  // 19: haut → 2×milieu → 2×haut
      [2,1,1,2,2],  // 20: bas  → 2×milieu → 2×bas

      // 21–30: schémas en « coin » inversés et alternés
      [0,0,2,0,0],  // 21: 2×haut → bas → 2×haut
      [2,2,0,2,2],  // 22: 2×bas  → haut → 2×bas
      [1,0,2,0,1],  // 23: milieu→ haut → bas → haut → milieu
      [1,2,0,2,1],  // 24: milieu→ bas  → haut → bas  → milieu
      [0,2,2,2,0],  // 25: haut → 3×bas → haut
      [2,0,0,0,2],  // 26: bas  → 3×haut→ bas
      [0,1,0,1,2],  // 27: haut → milieu→ haut → milieu→ bas
      [2,1,2,1,0],  // 28: bas  → milieu→ bas  → milieu→ haut
      [1,0,1,2,2],  // 29: milieu→ haut → milieu→ 2×bas
      [1,2,1,0,0],  // 30: milieu→ bas  → milieu→ 2×haut

      // 31–40: doubles zig-zag et formes « Z »
      [0,2,0,2,0],  // 31: haut–bas–haut–bas–haut
      [2,0,2,0,2],  // 32: bas–haut–bas–haut–bas
      [1,1,1,0,0],  // 33: 3×milieu → 2×haut
      [1,1,1,2,2],  // 34: 3×milieu → 2×bas
      [0,0,1,2,2],  // 35: 2×haut → milieu → 2×bas
      [2,2,1,0,0],  // 36: 2×bas  → milieu → 2×haut
      [0,2,1,0,0],  // 37: haut → bas → milieu → 2×haut
      [2,0,1,2,2],  // 38: bas  → haut → milieu → 2×bas
      [1,0,0,1,1],  // 39: milieu→ 2×haut → 2×milieu
      [1,2,2,1,1],  // 40: milieu→ 2×bas  → 2×milieu

      // 41–50: schémas « lunettes », « pont » et décalages
      [0,2,2,0,0],  // 41: haut → 2×bas → 2×haut
      [2,0,0,2,2],  // 42: bas  → 2×haut → 2×bas
      [1,1,0,0,1],  // 43: 2×milieu → 2×haut → milieu
      [1,1,2,2,1],  // 44: 2×milieu → 2×bas  → milieu
      [0,2,0,0,0],  // 45: haut → bas → 3×haut
      [2,0,2,2,2],  // 46: bas  → haut → 3×bas
      [0,0,1,0,2],  // 47: 2×haut → milieu → haut → bas
      [2,2,1,2,0],  // 48: 2×bas  → milieu → bas  → haut
      [1,0,2,2,1],  // 49: milieu→ haut → 2×bas → milieu
      [1,2,1,1,1],  // 50: milieu→ bas  → 3×milieu
    ];

    // PHASER CONFIGURATION
    const config = { type: Phaser.AUTO, width:720, height:1280, parent:'game-container', backgroundColor:'#000', scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH}, scene:{preload,create} };
    new Phaser.Game(config);

    function preload() {
      this.load.image('bg', 'data:image/png;base64,${bg64}');
      this.load.image('frame','data:image/png;base64,${frame64}');
      this.load.image('spin','data:image/png;base64,${spin64}');
      symbols.forEach(k=>this.load.image(k,symbolDataURIs[k]));
    }

    function create() {
      const {width,height} = this.scale;
      this.add.image(width/2,height/2,'bg').setDisplaySize(width,height);
      this.add.image(width/2,height/2,'frame').setDisplaySize(width,height);
      this.tokens = START_TOKENS;
      this.tokenText = this.add.text(20,20,'Jetons: '+this.tokens,{font:'32px Arial',fill:'#fff'}).setDepth(1);
      this.symbolSize = Math.round(128*0.85);
      this.visibleRows = 3;
      this.spacingX = Math.round(120*1.15);
      const startX = width/2 - 2*this.spacingX;
      this.reels = [];
      for(let i=0;i<5;i++){
        const cont = this.add.container(startX+i*this.spacingX,height/2);
        for(let r=0;r<this.visibleRows;r++){
          cont.add(this.add.image(0,(r-1)*this.symbolSize,Phaser.Utils.Array.GetRandom(symbols)).setDisplaySize(this.symbolSize,this.symbolSize));
        }
        this.reels.push(cont);
      }
      this.spinBtn = this.add.image(width/2,height-100,'spin').setDisplaySize(120,120).setInteractive().on('pointerdown',()=>spin.call(this));
    }

    function spin(){
      this.tokens-=BET_AMOUNT;
      this.tokenText.setText('Jetons: '+this.tokens);
      this.spinBtn.disableInteractive();
      const delay=150;
      this.reels.forEach((cont,idx)=>{
        const total=(this.visibleRows+symbols.length*3+Phaser.Math.Between(0,symbols.length-1))*this.symbolSize;
        this.tweens.add({targets:cont,y:'+='+total,duration:1000+idx*delay,ease:'Cubic.easeOut',onComplete:()=>{
          cont.y=this.scale.height/2;
          cont.list.forEach(img=>img.setTexture(Phaser.Utils.Array.GetRandom(symbols)));
          if(idx===this.reels.length-1){evaluateResult.call(this);this.spinBtn.setInteractive();}
        }});
      });
    }

    function evaluateResult(){
      const centerX=this.scale.width/2-2*this.spacingX;
      const centerY=this.scale.height/2;
      let totalWin=0;

      PAYLINES.forEach((pattern,index)=>{
        // crée la séquence des symboles sur cette ligne
        const seq = pattern.map((row,col)=> this.reels[col].list[row].texture.key );
        // compte les identiques depuis le début
        const first = seq[0]; let count=1;
        for(let i=1;i<seq.length;i++){ if(seq[i]===first) count++; else break; }
        if(count>=3){
          const win = PAYTABLE[count]||0; totalWin+=win;
          const winPattern = pattern.slice(0,count);
          const g = this.add.graphics(); g.lineStyle(6,0xffd700,1); g.beginPath();
          winPattern.forEach((row,colIdx)=>{
            const x = centerX + colIdx*this.spacingX;
            const y = centerY + (row-1)*this.symbolSize;
            colIdx===0?g.moveTo(x,y):g.lineTo(x,y);
          });
          g.strokePath();
          const msg = this.add.text(centerX+2*this.spacingX,centerY-200+index*20,'+'+win+' (L'+(index+1)+')',{font:'24px Arial',fill:'#ff0'}).setOrigin(0.5);
          this.time.delayedCall(2000,()=>{g.destroy();msg.destroy();});
        }
      });

      if(totalWin>0){ this.tokens+=totalWin; this.tokenText.setText('Jetons: '+this.tokens); }
    }
  </script>
</body>
</html>
      `.trim();

      setHtml(htmlContent);
    })();
  }, []);

  if (!html) return (<View style={styles.loader}><ActivityIndicator size="large"/></View>);

  return (<WebView originWhitelist={["*"]} source={{ html }} javaScriptEnabled domStorageEnabled style={styles.webview}/>);
}

const styles = StyleSheet.create({ loader:{flex:1,justifyContent:'center',alignItems:'center'}, webview:{flex:1} });
