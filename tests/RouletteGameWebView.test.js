import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react-native'
import { Alert } from 'react-native'

// ⚠️ On remoque ici expo-router pour contrôler replace()
jest.mock('expo-router', () => ({ useRouter: jest.fn() }))

// Firestore
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
}))

// Config Firebase + record
jest.mock('../config/firebaseConfig.js', () => ({
    auth: { currentUser: { uid: 'user123' } },
    db: {},
    recordGameResult: jest.fn(),
}))

import RouletteGameWebView from '../components/games/RouletteGameWebView.js'
import { useRouter } from 'expo-router'
import { doc, getDoc } from 'firebase/firestore'
import { recordGameResult } from '../config/firebaseConfig.js'

describe('RouletteGameWebView (nouvelle version)', () => {
    const replaceMock = jest.fn()
    jest.spyOn(Alert, 'alert').mockImplementation(() => { })

    beforeEach(() => {
        jest.clearAllMocks()
        // routeur contrôlable
        useRouter.mockReturnValue({ replace: replaceMock })
        // Firestore → balance 1000
        doc.mockReturnValue({ __fake: true })
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ walletBalance: 1000 }),
        })
    })

    it('affiche un loader puis la WebView une fois le HTML prêt', async () => {
        const { getByTestId, queryByTestId, findByTestId } = render(<RouletteGameWebView />)

        // loader présent au départ
        expect(getByTestId('loader')).toBeTruthy()

        // on attend que la WebView apparaisse (et donc que le html soit prêt)
        await findByTestId('webview')

        // le loader a disparu
        expect(queryByTestId('loader')).toBeNull()
    })

    it('injecte la balance dans le HTML (const WALLET_BALANCE)', async () => {
        const { getByTestId } = render(<RouletteGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))
        const html = webview.props?.source?.html || ''
        expect(html).toContain('const WALLET_BALANCE = 1000')
    })

    it('onMessage(action: goBack) appelle router.replace("/")', async () => {
        const { getByTestId } = render(<RouletteGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))
        await webview.props.onMessage({ nativeEvent: { data: JSON.stringify({ action: 'goBack' }) } })
        expect(replaceMock).toHaveBeenCalledWith('/')
    })

    it('onMessage(result) appelle recordGameResult avec les bonnes données', async () => {
        const { getByTestId } = render(<RouletteGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))

        const payload = {
            result: {
                game: 'roulette',
                wager: 40,
                payout: 80,
                winningNumber: 23,
                bets: [{ type: 'red', amount: 40 }],
            },
        }

        await webview.props.onMessage({ nativeEvent: { data: JSON.stringify(payload) } })

        expect(recordGameResult).toHaveBeenCalledTimes(1)
        expect(recordGameResult).toHaveBeenCalledWith('user123', expect.objectContaining({
            game: 'roulette',
            wager: 40,
            payout: 80,
            metadata: expect.objectContaining({
                winningNumber: 23,
                bets: expect.any(Array),
            }),
        }))
    })

    it('onMessage JSON invalide ne crashe pas', async () => {
        const { getByTestId } = render(<RouletteGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))
        await expect(webview.props.onMessage({ nativeEvent: { data: 'not-json' } }))
            .resolves.not.toThrow()
    })

    it('onError déclenche Alert.alert', async () => {
        const { getByTestId } = render(<RouletteGameWebView />)
        const webview = await waitFor(() => getByTestId('webview'))
        fireEvent(webview, 'onError', { nativeEvent: { description: 'Erreur WebView' } })
        expect(Alert.alert).toHaveBeenCalledWith('WebView erreur', 'Erreur WebView')
    })
})
