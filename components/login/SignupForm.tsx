// components/login/SignupForm.tsx
import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { COLORS } from '../../constants/layout'

export default function SignupForm({
    email, setEmail, userName, setUserName, password, setPassword, onSubmit, onSwitchLogin,
}: {
    email: string
    setEmail: (v: string) => void
    userName: string
    setUserName: (v: string) => void
    password: string
    setPassword: (v: string) => void
    onSubmit: () => void
    onSwitchLogin: () => void
}) {
    return (
        <View style={styles.formContainer}>
            <Text style={styles.title}>Créer un compte</Text>
            <TextInput
                style={styles.input}
                placeholder="Adresse e-mail"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Nom d'utilisateur (a-z, 0-9, _)"
                placeholderTextColor="rgba(255,255,255,0.6)"
                autoCapitalize="none"
                value={userName}
                onChangeText={setUserName}
            />
            <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="rgba(255,255,255,0.6)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
                <Text style={styles.primaryButtonText}>Valider</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onSwitchLogin}>
                <Text style={styles.secondaryButtonText}>Retour</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    formContainer: { width: '100%', maxWidth: 400, alignItems: 'center' },
    title: {
        fontSize: 26, marginBottom: 30, color: COLORS.accent, fontWeight: 'bold', textAlign: 'center',
        textShadowColor: 'rgba(255, 62, 128, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10, width: '100%',
    },
    input: {
        width: '100%', height: 55, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)', marginBottom: 20, paddingHorizontal: 20, color: '#fff', fontSize: 16, fontWeight: '500',
    },
    primaryButton: {
        width: '100%', height: 55, borderRadius: 12, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center',
        marginBottom: 15, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
    },
    primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    secondaryButton: {
        width: '100%', height: 55, borderRadius: 12, borderWidth: 2, borderColor: COLORS.accent, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'transparent',
    },
    secondaryButtonText: { color: COLORS.accent, fontSize: 16, fontWeight: '600' },
})
