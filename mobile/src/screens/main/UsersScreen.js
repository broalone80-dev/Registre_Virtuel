import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import api from '../../services/api';

export default function UsersScreen() {
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        try {
            const res = await api.get('/users');
            const d = res.data || res;
            setUsers(Array.isArray(d) ? d : d?.data || []);
        } catch (e) { console.log('Error:', e.message); }
    };

    useEffect(() => { load(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const ROLE_COLORS = {
        admin: '#ef4444', super_admin: '#ef4444', technician: '#f97316',
        receptionist: '#3b82f6', agent: '#3b82f6', manager: '#8b5cf6',
    };
    const ROLE_LABELS = {
        admin: 'Admin', super_admin: 'Super Admin', technician: 'Technicien',
        receptionist: 'Agent', agent: 'Agent', manager: 'Manager',
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            await api.patch(`/users/${id}`, { is_active: !currentStatus });
            setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !currentStatus } : u));
        } catch (e) { Alert.alert('Erreur', 'Impossible de modifier'); }
    };

    const renderItem = ({ item }) => {
        const roleColor = ROLE_COLORS[item.role] || '#64748b';
        return (
            <View style={s.card}>
                <View style={s.cardTop}>
                    <View style={s.avatar}>
                        <Text style={s.avatarText}>{item.first_name?.charAt(0)}{item.last_name?.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={s.name}>{item.first_name} {item.last_name}</Text>
                        <Text style={s.email}>{item.email}</Text>
                    </View>
                    <View style={[s.roleBadge, { backgroundColor: roleColor + '20' }]}>
                        <Text style={[s.roleText, { color: roleColor }]}>{ROLE_LABELS[item.role] || item.role}</Text>
                    </View>
                </View>
                <View style={s.actions}>
                    <View style={[s.statusDot, { backgroundColor: item.is_active ? '#22c55e' : '#ef4444' }]} />
                    <Text style={s.statusText}>{item.is_active ? 'Actif' : 'Inactif'}</Text>
                    <TouchableOpacity style={s.toggleBtn} onPress={() => toggleActive(item.id, item.is_active)}>
                        <Text style={s.toggleText}>{item.is_active ? 'Désactiver' : 'Activer'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={s.container}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <View style={s.header}>
                    <Text style={s.title}>👥 Utilisateurs</Text>
                    <Text style={s.count}>{users.length} utilisateur{users.length > 1 ? 's' : ''}</Text>
                </View>
                <FlatList data={users} renderItem={renderItem} keyExtractor={i => i.id?.toString()}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Aucun utilisateur</Text></View>}
                />
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
    count: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
    list: { padding: 24, paddingTop: 8 },
    card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
    cardTop: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e40af', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    name: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
    email: { fontSize: 12, color: '#94a3b8' },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    roleText: { fontSize: 11, fontWeight: '700' },
    actions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.08)' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 12, color: '#94a3b8', flex: 1 },
    toggleBtn: { backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    toggleText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { fontSize: 13, color: '#64748b' },
});
