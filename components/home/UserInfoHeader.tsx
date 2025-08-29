// components/home/UserInfoHeader.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import DailyBonus from './DailyBonus'
import { MINI_ICON, COLORS } from '../../constants/layout'

type Props = {
    userName: string
    walletBalance: number
}

export default function UserInfoHeader({ userName, walletBalance }: Props) {
    return (
        <View style={styles.userInfoContainer}>
            <View style={styles.headerGrid}>
                <View style={styles.colLeft} />

                <View style={styles.div1}>
                    <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
                        Bonjour <Text style={styles.highlight}>{userName || 'Joueur'}</Text> !
                    </Text>
                    <Text style={styles.balance} numberOfLines={1}>
                        Solde : <Text style={styles.highlight}>{walletBalance} jets</Text>
                    </Text>
                </View>

                <View style={styles.div2}>
                    <DailyBonus buttonStyle={styles.bonusButton} textStyle={styles.bonusButtonText} />
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    userInfoContainer: {
        width: '100%',
        marginBottom: 25,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        minHeight: 60,
    },
    colLeft: { flex: 1 },
    div1: {
        flex: 4,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    div2: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    greeting: {
        fontSize: 20,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 5,
        fontWeight: '500',
    },
    balance: {
        fontSize: 18,
        color: COLORS.textDim,
        textAlign: 'center',
    },

    bonusButton: {
        width: MINI_ICON,
        height: MINI_ICON,
        borderRadius: MINI_ICON / 2,
        backgroundColor: 'rgba(255, 62, 128, 0.15)',
        borderWidth: 1,
        borderColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bonusButtonText: {
        fontSize: 20,
        color: COLORS.accent,
        fontWeight: '600',
    },

    highlight: {
        color: COLORS.accent,
        fontWeight: 'bold',
    },
})
