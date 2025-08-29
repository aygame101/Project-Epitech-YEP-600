// components/games/roulette/htmlTemplate.js
import { phaserScript } from './phaserScript'

export function buildRouletteHtml({ walletBalance }) {
    return `
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="utf-8" />
    <meta name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <title>Roulette (Full Phaser)</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.js"></script>
    <style>
        html,
        body,
        #game {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
            background: transparent;
        }

        canvas {
            display: block;
            margin: auto;
        }
    </style>
</head>

<body>
    <div id="game"></div>
    <script>
        const WALLET_BALANCE = ${ Number(walletBalance) || 0};
    </script>
    <script>
${ phaserScript }
    </script>
</body>

</html>
`.trim()
}
