// tests/blackjackGameWebView.test.js
import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react-native'
import { Alert } from 'react-native'

// ⚠️ On NE re-moque pas ce qui est global (expo-router, webview, firestore, asset, filesystem, focusEffect, etc.)
// On moque uniquement la config projet (auth + record)
jest.mock('../config/firebaseConfig.js', () => ({
    auth: { currentUser: { uid: 'user123' } },
    db: {},
    recordGameResult: jest.fn(),
}))

import BlackjackGameWebView from '../components/games/BlackjackGameWebView.js'
import * as Router from 'expo-router'
import { doc, getDoc } from 'firebase/firestore'
import * as Cfg from '../config/firebaseConfig.js'

describe('BlackjackGameWebView', () => {
    const replaceMock = jest.fn()

    beforeAll(() => {
        jest.spyOn(Alert, 'alert').mockImplementation(() => { })
    })

    beforeEach(() => {
        jest.clearAllMocks()

        // Router : on force un objet partagé pour pouvoir inspecter replace()
        const routerObj = { push: jest.fn(), replace: replaceMock, back: jest.fn() }
        if (Router.useRouter && typeof Router.useRouter.mockReturnValue === 'function') {
            Router.useRouter.mockReturnValue(routerObj)
        } else {
            jest.spyOn(Router, 'useRouter').mockReturnValue(routerObj)
        }

        // Firestore : solde par défaut 1000
        doc.mockReturnValue({ __fake: true })
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ walletBalance: 1000 }),
        })
    })

    // ───────────────────────────────────────────────────────────
    // Rendu & HTML
    // ───────────────────────────────────────────────────────────
    it('rend la WebView quand le HTML est prêt', async () => {
        const { findByTestId } = render(<BlackjackGameWebView />)
        const webview = await findByTestId('webview')
        expect(webview).toBeTruthy()
    })

    it('injecte WALLET_BALANCE et ASSET_URIS dans le HTML', async () => {
        const { getByTestId } = render(<BlackjackGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))
        const html = webview.props?.source?.html || ''

        expect(html).toContain('const WALLET_BALANCE = 1000')
        expect(html).toContain('const ASSET_URIS =')
        // un check rapide sur Phaser présent
        expect(html).toContain('phaser.min.js')
    })

    it("si le doc Firestore n'existe pas → WALLET_BALANCE = 0", async () => {
        getDoc.mockResolvedValueOnce({ exists: () => false })
        const { getByTestId } = render(<BlackjackGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))
        const html = webview.props?.source?.html || ''
        expect(html).toContain('const WALLET_BALANCE = 0')
    })

    // ───────────────────────────────────────────────────────────
    // onMessage: navigation & scoreboard
    // ───────────────────────────────────────────────────────────
    it('onMessage(action: goBack) appelle router.replace("/")', async () => {
        const { getByTestId } = render(<BlackjackGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))

        await webview.props.onMessage({
            nativeEvent: { data: JSON.stringify({ action: 'goBack' }) },
        })
        expect(replaceMock).toHaveBeenCalledWith('/')
    })

    it('onMessage(type: gameResult) appelle recordGameResult avec les bonnes données', async () => {
        const { getByTestId } = render(<BlackjackGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))

        const payload = {
            type: 'gameResult',
            game: 'blackjack',
            wager: '50',     // strings → doivent être castés en Number()
            payout: '120',
            metadata: { mode: 'normal', player: { value: 20 } },
        }

        await webview.props.onMessage({
            nativeEvent: { data: JSON.stringify(payload) },
        })

        expect(Cfg.recordGameResult).toHaveBeenCalledTimes(1)
        expect(Cfg.recordGameResult).toHaveBeenCalledWith(
            'user123',
            expect.objectContaining({
                game: 'blackjack',
                wager: 50,        // ← cast
                payout: 120,      // ← cast
                metadata: expect.objectContaining({ mode: 'normal' }),
            })
        )
    })

    it("n'appelle pas recordGameResult si aucun utilisateur n'est connecté", async () => {
        const savedUser = Cfg.auth.currentUser
        Cfg.auth.currentUser = null
        try {
            const { getByTestId } = render(<BlackjackGameWebView />)
            const webview = await waitFor(() => getByTestId('webview'))

            const payload = {
                type: 'gameResult',
                wager: 10,
                payout: 0,
                metadata: { mode: 'normal' },
            }

            await webview.props.onMessage({
                nativeEvent: { data: JSON.stringify(payload) },
            })

            expect(Cfg.recordGameResult).not.toHaveBeenCalled()
        } finally {
            Cfg.auth.currentUser = savedUser
        }
    })

    it("onMessage JSON invalide n'explose pas", async () => {
        const { getByTestId } = render(<BlackjackGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))

        await expect(
            webview.props.onMessage({ nativeEvent: { data: '<<<not-json>>>' } })
        ).resolves.not.toThrow()
    })

    // ───────────────────────────────────────────────────────────
    // onError
    // ───────────────────────────────────────────────────────────
    it("onError déclenche Alert.alert('WebView erreur', ...)", async () => {
        const { getByTestId } = render(<BlackjackGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))

        fireEvent(webview, 'onError', {
            nativeEvent: { description: 'Erreur WebView' },
        })

        expect(Alert.alert).toHaveBeenCalledWith('WebView erreur', 'Erreur WebView')
    })
})
