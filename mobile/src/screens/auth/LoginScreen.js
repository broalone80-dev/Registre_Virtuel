import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ActivityIndicator, StatusBar, ScrollView, Dimensions, ImageBackground
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const login = useAuthStore((s) => s.login);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Veuillez remplir tous les champs');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { email: email.trim(), password });
            const data = res.data || res;
            await login(data.token, data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Identifiants incorrects');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* Brand Header */}
                    <View style={s.brandSection}>
                        <View style={s.logoWrap}>
                            <Text style={s.logoIcon}>🖥️</Text>
                        </View>
                        <Text style={s.brandName}>REGISTRE VIRTUEL</Text>
                        <Text style={s.brandSub}>Express Union · Gestion informatique</Text>
                    </View>

                    {/* Features */}
                    <View style={s.featuresRow}>
                        {[
                            { icon: '✅', text: 'Dashboard temps réel' },
                            { icon: '🔧', text: 'Suivi interventions' },
                            { icon: '📊', text: 'Diagnostics avancés' },
                        ].map((f, i) => (
                            <View key={i} style={s.featureChip}>
                                <Text style={s.featureIcon}>{f.icon}</Text>
                                <Text style={s.featureText}>{f.text}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Login Card */}
                    <View style={s.card}>
                        <Text style={s.cardTitle}>Connexion</Text>
                        <Text style={s.cardSub}>Accédez à votre espace de travail</Text>

                        {error ? (
                            <View style={s.errorBox}>
                                <Text style={s.errorIcon}>⚠️</Text>
                                <Text style={s.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={s.inputGroup}>
                            <Text style={s.label}>EMAIL</Text>
                            <View style={s.inputWrap}>
                                <Text style={s.inputIcon}>📧</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="votre@email.com"
                                    placeholderTextColor="#475569"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        <View style={s.inputGroup}>
                            <Text style={s.label}>MOT DE PASSE</Text>
                            <View style={s.inputWrap}>
                                <Text style={s.inputIcon}>🔒</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#475569"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                                    <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={s.forgotRow}>
                            <Text style={s.forgotLink}>Mot de passe oublié ?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[s.loginBtn, loading && { opacity: 0.7 }]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.loginBtnText}>Se connecter</Text>
                            )}
                        </TouchableOpacity>

                        <View style={s.divider}>
                            <View style={s.dividerLine} />
                            <Text style={s.dividerText}>OU</Text>
                            <View style={s.dividerLine} />
                        </View>

                        <TouchableOpacity style={s.registerBtn} onPress={() => navigation.navigate('Register')}>
                            <Text style={s.registerBtnText}>Créer un nouveau compte</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={s.footer}>© 2026 Registre Virtuel EU · v1.0.0</Text>
                </ScrollView>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 60 },
    // Brand
    brandSection: { alignItems: 'center', marginBottom: 24 },
    logoWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
    logoIcon: { fontSize: 30 },
    brandName: { fontSize: 24, fontWeight: '900', color: '#f1f5f9', letterSpacing: 2 },
    brandSub: { fontSize: 13, color: '#64748b', marginTop: 4, letterSpacing: 0.3 },
    // Features
    featuresRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    featureChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(148,163,184,0.06)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, gap: 5 },
    featureIcon: { fontSize: 12 },
    featureText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
    // Card
    card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(148,163,184,0.08)' },
    cardTitle: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.3 },
    cardSub: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 20 },
    // Error
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.08)', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)', gap: 8 },
    errorIcon: { fontSize: 16 },
    errorText: { color: '#ef4444', fontSize: 13, fontWeight: '500', flex: 1 },
    // Input
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 11, color: '#64748b', fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(148,163,184,0.1)' },
    inputIcon: { fontSize: 16, marginRight: 8 },
    input: { flex: 1, paddingVertical: 14, color: '#f1f5f9', fontSize: 15 },
    eyeBtn: { padding: 4 },
    eyeIcon: { fontSize: 18 },
    // Forgot
    forgotRow: { alignItems: 'flex-end', marginBottom: 20 },
    forgotLink: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
    // Buttons
    loginBtn: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center' },
    loginBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
    // Divider
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(148,163,184,0.1)' },
    dividerText: { color: '#475569', fontSize: 12, fontWeight: '600', marginHorizontal: 12 },
    // Register
    registerBtn: { borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    registerBtnText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
    // Footer
    footer: { fontSize: 11, color: '#334155', textAlign: 'center', marginTop: 24, letterSpacing: 0.3 },
});
