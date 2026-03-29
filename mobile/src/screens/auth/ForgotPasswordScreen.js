import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ActivityIndicator, StatusBar, ImageBackground
} from 'react-native';
import api from '../../services/api';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) return;
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: email.trim() });
            setSent(true);
        } catch (err) {
            // On affiche toujours "envoyé" pour éviter l'énumération
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <View style={s.content}>
                    <View style={s.header}>
                        <Text style={s.logo}>REGISTRE VIRTUEL</Text>
                        <Text style={s.subtitle}>Réinitialisation du mot de passe</Text>
                    </View>

                    <View style={s.card}>
                        {sent ? (
                            <View style={s.successBox}>
                                <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>✅</Text>
                                <Text style={s.successTitle}>Email envoyé !</Text>
                                <Text style={s.successText}>
                                    Si un compte existe avec l'adresse <Text style={{ color: '#60a5fa', fontWeight: '600' }}>{email}</Text>,
                                    vous recevrez un email avec un lien de réinitialisation.
                                </Text>
                                <Text style={s.spamText}>Vérifiez aussi vos spams.</Text>
                            </View>
                        ) : (
                            <View>
                                <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>📧</Text>
                                <Text style={s.cardTitle}>Mot de passe oublié ?</Text>
                                <Text style={s.cardDesc}>Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.</Text>

                                <View style={s.inputGroup}>
                                    <Text style={s.label}>EMAIL</Text>
                                    <TextInput
                                        style={s.input}
                                        placeholder="votre-email@example.com"
                                        placeholderTextColor="#64748b"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>✈️ Envoyer le lien</Text>}
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.backRow}>
                            <Text style={s.backLink}>← Retour à la connexion</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
    content: { flex: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 24 },
    logo: { fontSize: 24, fontWeight: '800', color: '#3b82f6', letterSpacing: 2 },
    subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
    card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    cardTitle: { fontSize: 20, fontWeight: '700', color: '#f1f5f9', textAlign: 'center', marginBottom: 8 },
    cardDesc: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
    input: { backgroundColor: '#334155', borderRadius: 8, padding: 14, color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    btn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, alignItems: 'center' },
    btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    successBox: { paddingVertical: 16 },
    successTitle: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', textAlign: 'center', marginBottom: 12 },
    successText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
    spamText: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 16 },
    backRow: { marginTop: 20, alignItems: 'center' },
    backLink: { color: '#3b82f6', fontSize: 14, fontWeight: '500' },
});
