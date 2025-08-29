import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import RouletteGameWebView from '../../components/games/RouletteGameWebView'

export default function RouletteScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top', 'right', 'left', 'bottom']}>
            <RouletteGameWebView />
        </SafeAreaView>
    )
}
