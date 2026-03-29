import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import api from '../../services/api';

export default function DiagnosticsScreen() {
    const [diagnostics, setDiagnostics] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await api.get('/diagnostics');
            const d = res.data || res;
            setDiagnostics(Array.isArray(d) ? d : d?.data || []);
        } catch (e) { console.log('Error:', e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const VERDICT_COLORS = {
        repairable: '#22c55e', not_repairable: '#ef4444', needs_parts: '#f59e0b', under_review: '#3b82f6',
    };
    const VERDICT_LABELS = {
        repairable: 'Réparable', not_repairable: 'Irréparable', needs_parts: 'Pièces nécessaires', under_review: 'En analyse',
    };

    const renderItem = ({ item }) => {
        const color = VERDICT_COLORS[item.verdict] || '#64748b';
        const label = VERDICT_LABELS[item.verdict] || item.verdict || 'N/A';
        return (
            <View style={s.card}>
                <View style={s.cardTop}>
                    <Text style={s.ref}>{item.equipment?.reference || `#${item.id?.slice(0, 8)}`}</Text>
                    <View style={[s.badge, { backgroundColor: color + '20' }]}>
                        <View style={[s.dot, { backgroundColor: color }]} />
                        <Text style={[s.badgeText, { color }]}>{label}</Text>
                    </View>
                </View>
                <Text style={s.info}>{item.equipment?.brand} {item.equipment?.model}</Text>
                {item.problem_identified && <Text style={s.problem} numberOfLines={2}>🔍 {item.problem_identified}</Text>}
                {item.estimated_cost && <Text style={s.cost}>💰 Coût estimé: {item.estimated_cost} FCFA</Text>}
                <Text style={s.date}>📅 {new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
            </View>
        );
    };

    return (
        <View style={s.container}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <View style={s.header}>
                    <Text style={s.title}>🔬 Diagnostics</Text>
                    <Text style={s.count}>{diagnostics.length} diagnostic{diagnostics.length > 1 ? 's' : ''}</Text>
                </View>
                <FlatList data={diagnostics} renderItem={renderItem} keyExtractor={i => i.id?.toString()}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    ListEmptyComponent={!loading && <View style={s.empty}><Text style={s.emptyText}>Aucun diagnostic</Text></View>}
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
    problem: { fontSize: 13, color: '#cbd5e1', marginTop: 8 },
    cost: { fontSize: 13, color: '#f59e0b', marginTop: 4, fontWeight: '600' },
    date: { fontSize: 11, color: '#64748b', marginTop: 6 },
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { fontSize: 13, color: '#64748b' },
});
