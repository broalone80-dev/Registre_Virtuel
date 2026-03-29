import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ActivityIndicator, StatusBar, ScrollView, Alert, Modal, FlatList, ImageBackground
} from 'react-native';
import api from '../../services/api';

export default function RegisterScreen({ navigation }) {
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', password: '',
        confirmPassword: '', phone: '', role: 'receptionist', agency_id: ''
    });
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showAgencyModal, setShowAgencyModal] = useState(false);

    useEffect(() => {
        api.get('/agencies').then(res => {
            const data = res.data || res;
            if (Array.isArray(data)) setAgencies(data);
            else if (data?.data) setAgencies(data.data);
        }).catch(() => { });
    }, []);

    const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const ROLES = [
        { value: 'receptionist', label: 'Agent Express Union' },
        { value: 'technician', label: 'Maintenancier' },
    ];

    const handleRegister = async () => {
        setError('');
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }
        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        if (formData.role === 'receptionist' && !formData.agency_id) {
            setError('Veuillez sélectionner votre agence');
            return;
        }

        setLoading(true);
        try {
            const { confirmPassword, ...submitData } = formData;
            await api.post('/auth/register', submitData);
            Alert.alert('✅ Succès', 'Compte créé ! Connectez-vous.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    const selectedRole = ROLES.find(r => r.value === formData.role);
    const selectedAgency = agencies.find(a => a.id === formData.agency_id);

    return (
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

                    <View style={s.header}>
                        <Text style={s.logo}>REGISTRE VIRTUEL</Text>
                        <Text style={s.subtitle}>Créer un compte</Text>
                    </View>

                    <View style={s.form}>
                        {error ? (
                            <View style={s.errorBox}><Text style={s.errorText}>⚠️ {error}</Text></View>
                        ) : null}

                        <View style={s.row}>
                            <View style={[s.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={s.label}>👤 PRÉNOM</Text>
                                <TextInput style={s.input} placeholder="Prénom" placeholderTextColor="#64748b"
                                    value={formData.first_name} onChangeText={v => update('first_name', v)} />
                            </View>
                            <View style={[s.inputGroup, { flex: 1 }]}>
                                <Text style={s.label}>👤 NOM</Text>
                                <TextInput style={s.input} placeholder="Nom" placeholderTextColor="#64748b"
                                    value={formData.last_name} onChangeText={v => update('last_name', v)} />
                            </View>
                        </View>

                        <View style={s.inputGroup}>
                            <Text style={s.label}>📧 EMAIL</Text>
                            <TextInput style={s.input} placeholder="email@example.com" placeholderTextColor="#64748b"
                                value={formData.email} onChangeText={v => update('email', v)}
                                keyboardType="email-address" autoCapitalize="none" />
                        </View>

                        <View style={s.inputGroup}>
                            <Text style={s.label}>📱 TÉLÉPHONE</Text>
                            <TextInput style={s.input} placeholder="+237 6XX XXX XXX" placeholderTextColor="#64748b"
                                value={formData.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />
                        </View>

                        {/* Sélecteur de rôle — Modal */}
                        <View style={s.inputGroup}>
                            <Text style={s.label}>👔 PROFIL</Text>
                            <TouchableOpacity style={s.picker} onPress={() => setShowRoleModal(true)}>
                                <Text style={s.pickerText}>{selectedRole?.label}</Text>
                                <Text style={s.pickerArrow}>▼</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sélecteur d'agence — Modal */}
                        {formData.role === 'receptionist' && (
                            <View style={s.inputGroup}>
                                <Text style={s.label}>🏢 AGENCE</Text>
                                <TouchableOpacity style={s.picker} onPress={() => setShowAgencyModal(true)}>
                                    <Text style={[s.pickerText, !selectedAgency && { color: '#64748b' }]}>
                                        {selectedAgency ? `${selectedAgency.name} (${selectedAgency.code})` : '-- Choisir votre agence --'}
                                    </Text>
                                    <Text style={s.pickerArrow}>▼</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={s.row}>
                            <View style={[s.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={s.label}>🔒 MOT DE PASSE</Text>
                                <TextInput style={s.input} placeholder="Min. 6 car." placeholderTextColor="#64748b"
                                    value={formData.password} onChangeText={v => update('password', v)} secureTextEntry />
                            </View>
                            <View style={[s.inputGroup, { flex: 1 }]}>
                                <Text style={s.label}>🔒 CONFIRMER</Text>
                                <TextInput style={s.input} placeholder="Confirmer" placeholderTextColor="#64748b"
                                    value={formData.confirmPassword} onChangeText={v => update('confirmPassword', v)} secureTextEntry />
                            </View>
                        </View>

                        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>📝 Créer mon compte</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.linkRow}>
                            <Text style={s.linkText}>Déjà un compte ? </Text>
                            <Text style={s.linkBlue}>Se connecter</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Modal Rôle */}
                <Modal visible={showRoleModal} transparent animationType="slide">
                    <View style={s.modalOverlay}>
                        <View style={s.modalContent}>
                            <Text style={s.modalTitle}>Sélectionner un profil</Text>
                            {ROLES.map(r => (
                                <TouchableOpacity key={r.value}
                                    style={[s.modalItem, formData.role === r.value && s.modalItemActive]}
                                    onPress={() => { update('role', r.value); setShowRoleModal(false); }}>
                                    <Text style={[s.modalItemText, formData.role === r.value && { color: '#3b82f6' }]}>
                                        {formData.role === r.value ? '✓ ' : '  '}{r.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={s.modalCancel} onPress={() => setShowRoleModal(false)}>
                                <Text style={s.modalCancelText}>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Modal Agence */}
                <Modal visible={showAgencyModal} transparent animationType="slide">
                    <View style={s.modalOverlay}>
                        <View style={s.modalContent}>
                            <Text style={s.modalTitle}>Sélectionner une agence</Text>
                            <FlatList
                                data={agencies}
                                keyExtractor={a => a.id?.toString()}
                                style={{ maxHeight: 300 }}
                                renderItem={({ item: a }) => (
                                    <TouchableOpacity
                                        style={[s.modalItem, formData.agency_id === a.id && s.modalItemActive]}
                                        onPress={() => { update('agency_id', a.id); setShowAgencyModal(false); }}>
                                        <Text style={[s.modalItemText, formData.agency_id === a.id && { color: '#3b82f6' }]}>
                                            {formData.agency_id === a.id ? '✓ ' : '  '}{a.name} ({a.code})
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={s.emptyText}>Aucune agence disponible</Text>}
                            />
                            <TouchableOpacity style={s.modalCancel} onPress={() => setShowAgencyModal(false)}>
                                <Text style={s.modalCancelText}>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 24 },
    logo: { fontSize: 24, fontWeight: '800', color: '#3b82f6', letterSpacing: 2 },
    subtitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginTop: 8 },
    form: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    errorBox: { backgroundColor: 'rgba(239,68,68,0.12)', padding: 14, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    errorText: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
    row: { flexDirection: 'row' },
    inputGroup: { marginBottom: 14 },
    label: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
    input: { backgroundColor: '#334155', borderRadius: 8, padding: 12, color: '#f1f5f9', fontSize: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    picker: { backgroundColor: '#334155', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerText: { color: '#f1f5f9', fontSize: 14, flex: 1 },
    pickerArrow: { color: '#64748b', fontSize: 12 },
    btn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
    btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    linkText: { color: '#94a3b8', fontSize: 14 },
    linkBlue: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 16, textAlign: 'center' },
    modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.08)', borderRadius: 8 },
    modalItemActive: { backgroundColor: 'rgba(59,130,246,0.1)' },
    modalItemText: { fontSize: 16, color: '#f1f5f9' },
    modalCancel: { marginTop: 12, padding: 16, backgroundColor: '#334155', borderRadius: 12, alignItems: 'center' },
    modalCancelText: { fontSize: 15, color: '#94a3b8', fontWeight: '600' },
    emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', padding: 24 },
});
