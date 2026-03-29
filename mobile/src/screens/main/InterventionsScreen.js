import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ImageBackground } from 'react-native';
import api from '../../services/api';

const STATUS_MAP = {
    pending: { label: 'En attente', color: '#f59e0b' },
    in_progress: { label: 'En cours', color: '#3b82f6' },
    paused: { label: 'En pause', color: '#94a3b8' },
    completed: { label: 'Terminée', color: '#22c55e' },
    cancelled: { label: 'Annulée', color: '#ef4444' },
};

export default function InterventionsScreen() {
    const [interventions, setInterventions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await api.get('/interventions');
            const d = res.data || res;
            setInterventions(Array.isArray(d) ? d : d?.data || []);
        } catch (e) { console.log('Error:', e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const renderItem = ({ item }) => {
        const st = STATUS_MAP[item.status] || { label: item.status, color: '#64748b' };
        const progress = item.progress || 0;
        return (
            <View style={s.card}>
                <View style={s.cardTop}>
                    <Text style={s.ref}>{item.equipment?.reference || 'N/A'}</Text>
                    <View style={[s.badge, { backgroundColor: st.color + '20' }]}>
                        <View style={[s.dot, { backgroundColor: st.color }]} />
                        <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                </View>
                <Text style={s.info}>{item.equipment?.brand} {item.equipment?.model}</Text>
                {item.technician && <Text style={s.tech}>🔧 {item.technician.first_name} {item.technician.last_name}</Text>}

                {/* Progress bar */}
                <View style={s.progressBar}>
                    <View style={[s.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={s.progressText}>{progress}% — {item.maintenance_step || 'N/A'}</Text>

                {item.actions_performed && (
                    <Text style={s.actions} numberOfLines={2}>📝 {item.actions_performed}</Text>
                )}
                <Text style={s.date}>📅 {new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
            </View>
        );
    };

    return (
        <View style={s.container}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <View style={s.header}>
                    <Text style={s.title}>🔧 Interventions</Text>
                    <Text style={s.count}>{interventions.length} intervention{interventions.length > 1 ? 's' : ''}</Text>
                </View>
                <FlatList data={interventions} renderItem={renderItem} keyExtractor={i => i.id?.toString()}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    ListEmptyComponent={!loading && <View style={s.empty}><Text style={s.emptyText}>Aucune intervention</Text></View>}
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
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    ref: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    info: { fontSize: 13, color: '#94a3b8' },
    tech: { fontSize: 13, color: '#60a5fa', marginTop: 4 },
    progressBar: { height: 4, backgroundColor: '#334155', borderRadius: 2, marginTop: 12 },
    progressFill: { height: 4, backgroundColor: '#3b82f6', borderRadius: 2 },
    progressText: { fontSize: 11, color: '#64748b', marginTop: 4 },
    actions: { fontSize: 12, color: '#cbd5e1', marginTop: 8 },
    date: { fontSize: 11, color: '#64748b', marginTop: 6 },
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { fontSize: 13, color: '#64748b' },
});
