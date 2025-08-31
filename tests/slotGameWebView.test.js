// tests/slotGameWebView.test.js
import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react-native'
import { Alert } from 'react-native'
import * as cfg from '../config/firebaseConfig.js'

// ⚠️ On NE re-moque pas ce qui l’est déjà globalement dans jest.setup.ts
// (expo-router, react-native-webview, @react-navigation/native, expo-asset, expo-file-system, firestore, etc.)

// On mocke uniquement la config projet (auth + record)
jest.mock('../config/firebaseConfig.js', () => ({
    auth: { currentUser: { uid: 'user123' } },
    db: {},
    recordGameResult: jest.fn(),
}))

import SlotGameWebView from '../components/games/SlotGameWebView.js'
import { useRouter } from 'expo-router'
import { doc, getDoc } from 'firebase/firestore'
import { recordGameResult } from '../config/firebaseConfig.js'

describe('SlotGameWebView', () => {
    const replaceMock = jest.fn()

    beforeAll(() => {
        jest.spyOn(Alert, 'alert').mockImplementation(() => { })
    })

    beforeEach(() => {
        jest.clearAllMocks()
        // Router remplace (mock global) -> on récupère et on force l’implémentation souhaitée
        useRouter.mockReturnValue({ push: jest.fn(), replace: replaceMock, back: jest.fn() })

        // Firestore par défaut → balance 1000
        doc.mockReturnValue({ __fake: true })
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ walletBalance: 1000 }),
        })
    })

    it('rend la WebView quand le HTML est prêt', async () => {
        const { findByTestId } = render(<SlotGameWebView />)
        const webview = await findByTestId('webview')
        expect(webview).toBeTruthy()
    })

    it('injecte la balance Firestore dans le HTML (let tokens = ...)', async () => {
        const { getByTestId } = render(<SlotGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))
        const html = webview.props?.source?.html || ''
        expect(html).toContain('let tokens = 1000')
        expect(html).toContain('window.ReactNativeWebView.postMessage')
        expect(html).toContain('const PAYLINES =')
    })

    it("si le doc Firestore n'existe pas → tokens = 0 dans le HTML", async () => {
        getDoc.mockResolvedValueOnce({ exists: () => false })
        const { getByTestId } = render(<SlotGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))
        const html = webview.props?.source?.html || ''
        expect(html).toContain('let tokens = 0')
    })

    it('onMessage(action: goBack) appelle router.replace("/")', async () => {
        const { getByTestId } = render(<SlotGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))

        await webview.props.onMessage({
            nativeEvent: { data: JSON.stringify({ action: 'goBack' }) },
        })
        expect(replaceMock).toHaveBeenCalledWith('/')
    })

    it('onMessage(result) appelle recordGameResult avec les bonnes données', async () => {
        const { getByTestId } = render(<SlotGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))

        const payload = {
            result: { game: 'slots', wager: 50, payout: 120, lines: 28 },
        }

        await webview.props.onMessage({
            nativeEvent: { data: JSON.stringify(payload) },
        })

        expect(recordGameResult).toHaveBeenCalledTimes(1)
        expect(recordGameResult).toHaveBeenCalledWith(
            'user123',
            expect.objectContaining({
                game: 'slots',
                wager: 50,
                payout: 120,
                metadata: expect.objectContaining({ lines: 28 }),
            })
        )
    })

    it("onMessage(result) n'appelle pas recordGameResult si aucun utilisateur n'est connecté", async () => {
        const savedUser = cfg.auth.currentUser
        cfg.auth.currentUser = null
        try {
            const { getByTestId } = render(<SlotGameWebView />)
            const webview = await waitFor(() => getByTestId('webview'))

            const payload = { result: { game: 'slots', wager: 10, payout: 0, lines: 5 } }
            await webview.props.onMessage({ nativeEvent: { data: JSON.stringify(payload) } })

            expect(cfg.recordGameResult).not.toHaveBeenCalled()
        } finally {
            cfg.auth.currentUser = savedUser
        }
    })


    it("onMessage JSON invalide n'explose pas", async () => {
        const { getByTestId } = render(<SlotGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))

        await expect(
            webview.props.onMessage({ nativeEvent: { data: '<<<not-json>>>' } })
        ).resolves.not.toThrow()
    })

    it("onError déclenche Alert.alert('WebView erreur', ...)", async () => {
        const { getByTestId } = render(<SlotGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))

        fireEvent(webview, 'onError', {
            nativeEvent: { description: 'Erreur WebView' },
        })
        expect(Alert.alert).toHaveBeenCalledWith('WebView erreur', 'Erreur WebView')
    })
})
