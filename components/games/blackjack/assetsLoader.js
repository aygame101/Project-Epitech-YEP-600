import { Asset } from 'expo-asset'
import * as FileSystem from 'expo-file-system'

export async function loadBlackjackAssets() {
    const modules = [
        require('../../../assets/games/blackjack/table-background.png'),
        require('../../../assets/games/blackjack/cards_spritesheetX2.png'),
        require('../../../assets/games/blackjack/red_backX2.png'),
        require('../../../assets/games/blackjack/button-hit.png'),
        require('../../../assets/games/blackjack/button-stand.png'),
        require('../../../assets/games/blackjack/bet-button.png'),
        require('../../../assets/games/blackjack/back-button.png'),
        require('../../../assets/games/blackjack/play-button.png'),
        require('../../../assets/games/blackjack/replay-button.png'),
        require('../../../assets/games/blackjack/split-button.png'),
        require('../../../assets/games/blackjack/double-button.png'),
    ]

    const assets = await Promise.all(modules.map(m => Asset.fromModule(m).downloadAsync()))
    const b64s = await Promise.all(
        assets.map(a =>
            FileSystem.readAsStringAsync(a.localUri || a.uri, {
                encoding: FileSystem.EncodingType.Base64,
            })
        )
    )

    const toDataUri = b => 'data:image/png;base64,' + b

    const [
        bg,
        cards,
        back,
        hit,
        stand,
        bet,
        backBtn,
        play,
        replay,
        split,
        doubleBtn,
    ] = b64s.map(toDataUri)

    return {
        bg,
        cards,
        back,
        hit,
        stand,
        bet,
        backBtn,
        play,
        replay,
        split,
        double: doubleBtn,
    }
}
