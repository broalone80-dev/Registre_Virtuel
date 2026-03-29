import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, StatusBar, ImageBackground
} from 'react-native';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function DepotScreen() {
    const user = useAuthStore((s) => s.user);
    const [types, setTypes] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [showAgencyPicker, setShowAgencyPicker] = useState(false);

    const [form, setForm] = useState({
        brand: '', model: '', serial_number: '', type_id: '',
        agency_id: user?.agency_id || '', problem_description: '',
        priority: 'normal', depositor_first_name: '', depositor_last_name: '',
        depositor_phone: '', depositor_email: '', accessories: '',
    });

    useEffect(() => {
        api.get('/equipment-types').then(r => setTypes(r.data || r || [])).catch(() => { });
        api.get('/agencies').then(r => {
            const d = r.data || r;
            setAgencies(Array.isArray(d) ? d : d?.data || []);
        }).catch(() => { });
    }, []);

    const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const selectedType = types.find(t => t.id === form.type_id);
    const selectedAgency = agencies.find(a => a.id === form.agency_id);

    const handleSubmit = async () => {
        if (!form.brand || !form.model || !form.problem_description) {
            Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (marque, modèle, problème)');
            return;
        }
        setLoading(true);
        try {
            await api.post('/equipments', {
                ...form,
                received_by: user?.id,
                depositor: {
                    first_name: form.depositor_first_name,
                    last_name: form.depositor_last_name,
                    phone: form.depositor_phone,
                    email: form.depositor_email,
                },
            });
            Alert.alert('✅ Succès', 'Équipement déposé avec succès !');
            setForm({
                brand: '', model: '', serial_number: '', type_id: '',
                agency_id: user?.agency_id || '', problem_description: '',
                priority: 'normal', depositor_first_name: '', depositor_last_name: '',
                depositor_phone: '', depositor_email: '', accessories: '',
            });
        } catch (err) {
            Alert.alert('Erreur', err.response?.data?.message || 'Impossible de déposer');
        } finally {
            setLoading(false);
        }
    };

    const PRIORITIES = [
        { value: 'low', label: '🟢 Basse' },
        { value: 'normal', label: '🟡 Normale' },
        { value: 'high', label: '🟠 Haute' },
        { value: 'critical', label: '🔴 Critique' },
    ];

    return (
        <View style={s.container}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <View style={s.header}>
                    <Text style={s.title}>📦 Dépôt Équipement</Text>
                    <Text style={s.sub}>Enregistrer un nouvel équipement</Text>
                </View>
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                    {/* Équipement */}
                    <Text style={s.sectionTitle}>Équipement</Text>
                    <View style={s.row}>
                        <View style={[s.field, { flex: 1, marginRight: 8 }]}>
                            <Text style={s.label}>MARQUE *</Text>
                            <TextInput style={s.input} placeholder="Ex: HP" placeholderTextColor="#64748b" value={form.brand} onChangeText={v => update('brand', v)} />
                        </View>
                        <View style={[s.field, { flex: 1 }]}>
                            <Text style={s.label}>MODÈLE *</Text>
                            <TextInput style={s.input} placeholder="Ex: ProBook" placeholderTextColor="#64748b" value={form.model} onChangeText={v => update('model', v)} />
                        </View>
                    </View>
                    <View style={s.field}>
                        <Text style={s.label}>N° SÉRIE</Text>
                        <TextInput style={s.input} placeholder="Numéro de série" placeholderTextColor="#64748b" value={form.serial_number} onChangeText={v => update('serial_number', v)} />
                    </View>
                    <View style={s.field}>
                        <Text style={s.label}>TYPE</Text>
                        <TouchableOpacity style={s.picker} onPress={() => setShowTypePicker(!showTypePicker)}>
                            <Text style={s.pickerText}>{selectedType?.name || '-- Sélectionner --'}</Text>
                        </TouchableOpacity>
                        {showTypePicker && <View style={s.dropdown}>{types.map(t => (
                            <TouchableOpacity key={t.id} style={s.dropItem} onPress={() => { update('type_id', t.id); setShowTypePicker(false); }}>
                                <Text style={s.dropText}>{t.name}</Text>
                            </TouchableOpacity>
                        ))}</View>}
                    </View>

                    {/* Problème */}
                    <Text style={s.sectionTitle}>Problème *</Text>
                    <View style={s.field}>
                        <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Décrivez le problème..." placeholderTextColor="#64748b"
                            value={form.problem_description} onChangeText={v => update('problem_description', v)} multiline numberOfLines={4} />
                    </View>

                    {/* Priorité */}
                    <Text style={s.sectionTitle}>Priorité</Text>
                    <View style={[s.row, { flexWrap: 'wrap', gap: 8 }]}>
                        {PRIORITIES.map(p => (
                            <TouchableOpacity key={p.value} style={[s.prioBtn, form.priority === p.value && s.prioBtnActive]}
                                onPress={() => update('priority', p.value)}>
                                <Text style={[s.prioText, form.priority === p.value && { color: '#3b82f6' }]}>{p.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Accessoires */}
                    <Text style={[s.sectionTitle, { marginTop: 16 }]}>Accessoires</Text>
                    <View style={s.field}>
                        <TextInput style={s.input} placeholder="Chargeur, souris, etc." placeholderTextColor="#64748b"
                            value={form.accessories} onChangeText={v => update('accessories', v)} />
                    </View>

                    {/* Déposant */}
                    <Text style={s.sectionTitle}>Déposant</Text>
                    <View style={s.row}>
                        <View style={[s.field, { flex: 1, marginRight: 8 }]}>
                            <TextInput style={s.input} placeholder="Prénom" placeholderTextColor="#64748b" value={form.depositor_first_name} onChangeText={v => update('depositor_first_name', v)} />
                        </View>
                        <View style={[s.field, { flex: 1 }]}>
                            <TextInput style={s.input} placeholder="Nom" placeholderTextColor="#64748b" value={form.depositor_last_name} onChangeText={v => update('depositor_last_name', v)} />
                        </View>
                    </View>
                    <View style={s.row}>
                        <View style={[s.field, { flex: 1, marginRight: 8 }]}>
                            <TextInput style={s.input} placeholder="Téléphone" placeholderTextColor="#64748b" value={form.depositor_phone} onChangeText={v => update('depositor_phone', v)} keyboardType="phone-pad" />
                        </View>
                        <View style={[s.field, { flex: 1 }]}>
                            <TextInput style={s.input} placeholder="Email" placeholderTextColor="#64748b" value={form.depositor_email} onChangeText={v => update('depositor_email', v)} keyboardType="email-address" autoCapitalize="none" />
                        </View>
                    </View>

                    <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>📦 Déposer l'équipement</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </ImageBackground>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
    title: { fontSize: 22, fontWeight: '700', color: '#f1f5f9' },
    sub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
    scroll: { padding: 24, paddingTop: 8 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#60a5fa', marginBottom: 12, marginTop: 8 },
    row: { flexDirection: 'row' },
    field: { marginBottom: 12 },
    label: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.6, marginBottom: 4 },
    input: { backgroundColor: '#1e293b', borderRadius: 8, padding: 12, color: '#f1f5f9', fontSize: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    picker: { backgroundColor: '#1e293b', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    pickerText: { color: '#f1f5f9', fontSize: 14 },
    dropdown: { backgroundColor: '#1e293b', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    dropItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.06)' },
    dropText: { color: '#f1f5f9', fontSize: 14 },
    prioBtn: { backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    prioBtnActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)' },
    prioText: { fontSize: 13, color: '#94a3b8' },
    submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
