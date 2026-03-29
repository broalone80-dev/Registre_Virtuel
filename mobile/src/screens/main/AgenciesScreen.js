import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import api from '../../services/api';

export default function AgenciesScreen() {
    const [agencies, setAgencies] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const res = await api.get('/agencies');
            const d = res.data || res;
            setAgencies(Array.isArray(d) ? d : d?.data || []);
        } catch (e) { console.log('Error:', e.message); }
    };

    useEffect(() => { load(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleAdd = async () => {
        if (!newName.trim() || !newCode.trim()) { Alert.alert('Erreur', 'Remplissez tous les champs'); return; }
        setSaving(true);
        try {
            await api.post('/agencies', { name: newName.trim(), code: newCode.trim() });
            setNewName(''); setNewCode(''); setShowAdd(false);
            await load();
            Alert.alert('✅', 'Agence créée');
        } catch (e) { Alert.alert('Erreur', e.response?.data?.message || 'Impossible'); }
        finally { setSaving(false); }
    };

    const renderItem = ({ item }) => (
        <View style={s.card}>
            <View style={s.cardTop}>
                <View style={s.codeBox}><Text style={s.codeText}>{item.code}</Text></View>
                <Text style={s.name}>{item.name}</Text>
            </View>
            {item.address && <Text style={s.address}>📍 {item.address}</Text>}
        </View>
    );

    return (
        <View style={s.container}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <View style={s.header}>
                    <View>
                        <Text style={s.title}>🏢 Agences</Text>
                        <Text style={s.count}>{agencies.length} agence{agencies.length > 1 ? 's' : ''}</Text>
                    </View>
                    <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(!showAdd)}>
                        <Text style={s.addText}>{showAdd ? '✕' : '＋'} {showAdd ? 'Annuler' : 'Ajouter'}</Text>
                    </TouchableOpacity>
                </View>

                {showAdd && (
                    <View style={s.addForm}>
                        <TextInput style={s.input} placeholder="Nom de l'agence" placeholderTextColor="#64748b"
                            value={newName} onChangeText={setNewName} />
                        <TextInput style={[s.input, { marginTop: 8 }]} placeholder="Code (ex: DLA-C)" placeholderTextColor="#64748b"
                            value={newCode} onChangeText={setNewCode} autoCapitalize="characters" />
                        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveText}>Créer l'agence</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                <FlatList data={agencies} renderItem={renderItem} keyExtractor={i => i.id?.toString()}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Aucune agence</Text></View>}
                />
            </ImageBackground>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    title: { fontSize: 22, fontWeight: '700', color: '#f1f5f9' },
    count: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
    addBtn: { backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
    addText: { fontSize: 13, color: '#3b82f6', fontWeight: '700' },
    addForm: { marginHorizontal: 24, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    input: { backgroundColor: '#334155', borderRadius: 8, padding: 12, color: '#f1f5f9', fontSize: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    saveBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
    saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    list: { padding: 24, paddingTop: 12 },
    card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    cardTop: { flexDirection: 'row', alignItems: 'center' },
    codeBox: { backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12 },
    codeText: { fontSize: 13, color: '#3b82f6', fontWeight: '700', letterSpacing: 0.5 },
    name: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
    address: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { fontSize: 13, color: '#64748b' },
});
