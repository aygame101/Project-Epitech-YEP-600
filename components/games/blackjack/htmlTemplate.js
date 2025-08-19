import { phaserScript } from './phaserScript'

export function buildBlackjackHtml({ assets, walletBalance }) {
    return `
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
    <title>Blackjack</title>
    <style>
        html,
        body,
        #game-container {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
            background: url(${assets.bg}) center/cover no-repeat;
        }

        canvas {
            display: block;
        }
    </style>
</head>

<body>
    <div id="game-container"></div>
    <script>
        const ASSET_URIS = ${ JSON.stringify(assets)};
        const WALLET_BALANCE = ${ Number(walletBalance) || 0};
    </script>
    <script>
${ phaserScript }
    </script>
</body>

</html>
`.trim()
}
