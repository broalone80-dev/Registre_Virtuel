import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl,
    TouchableOpacity, StatusBar, Alert, ImageBackground
} from 'react-native';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const STATUS_MAP = {
    received: { label: 'Reçu', color: '#f59e0b', icon: '📥', step: 1 },
    in_diagnostic: { label: 'Diagnostic', color: '#3b82f6', icon: '🔬', step: 2 },
    in_repair: { label: 'Réparation', color: '#f97316', icon: '🔧', step: 3 },
    repaired: { label: 'Réparé', color: '#22c55e', icon: '✅', step: 4 },
    waiting_pickup: { label: 'Prêt', color: '#10b981', icon: '📋', step: 5 },
    delivered: { label: 'Livré', color: '#64748b', icon: '📦', step: 6 },
};

export default function SuiviScreen() {
    const user = useAuthStore((s) => s.user);
    const [equipments, setEquipments] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await api.get('/equipments');
            const data = Array.isArray(res) ? res : res?.data || [];
            const filtered = data.filter(e =>
                e.received_by === user?.id ||
                e.agency_id === user?.agency_id
            );
            setEquipments(filtered);
        } catch (e) { console.log(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleConfirmPickup = async (id) => {
        Alert.alert('Confirmer', 'Marquer cet équipement comme livré ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Confirmer', onPress: async () => {
                    try {
                        await api.patch(`/equipments/${id}`, { status: 'delivered' });
                        await load();
                    } catch (e) { Alert.alert('Erreur', 'Action impossible'); }
                }
            }
        ]);
    };

    const getProgress = (status) => {
        const st = STATUS_MAP[status];
        return st ? (st.step / 6) * 100 : 0;
    };

    const renderItem = ({ item }) => {
        const st = STATUS_MAP[item.status] || { label: item.status, color: '#64748b', icon: '📦', step: 0 };
        const progress = getProgress(item.status);

        return (
            <View style={s.card}>
                {/* Header */}
                <View style={s.cardHeader}>
                    <View style={[s.iconWrap, { backgroundColor: st.color + '15' }]}>
                        <Text style={s.icon}>{st.icon}</Text>
                    </View>
                    <View style={s.cardInfo}>
                        <Text style={s.name}>{item.brand} {item.model}</Text>
                        <Text style={s.ref}>{item.reference || '—'}</Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: st.color + '15' }]}>
                        <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                </View>

                {/* Progress bar */}
                <View style={s.progressSection}>
                    <View style={s.progressBar}>
                        <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: st.color }]} />
                    </View>
                    <Text style={s.progressText}>{Math.round(progress)}%</Text>
                </View>

                {/* Timeline mini */}
                <View style={s.timeline}>
                    {Object.entries(STATUS_MAP).map(([key, val], idx) => (
                        <View key={key} style={s.timelineDot}>
                            <View style={[s.dot, { backgroundColor: val.step <= st.step ? st.color : '#334155' }]} />
                            {idx < 5 && <View style={[s.timelineLine, { backgroundColor: val.step < st.step ? st.color : '#334155' }]} />}
                        </View>
                    ))}
                </View>

                {/* Depositor info */}
                {item.depositor && (
                    <View style={s.depositorRow}>
                        <Text style={s.depositorLabel}>👤 Déposant :</Text>
                        <Text style={s.depositorName}>{item.depositor.first_name} {item.depositor.last_name}</Text>
                    </View>
                )}

                {/* Date */}
                <View style={s.dateRow}>
                    <Text style={s.dateLabel}>📅 Reçu le {item.received_at ? new Date(item.received_at).toLocaleDateString('fr-FR') : '—'}</Text>
                </View>

                {/* Action */}
                {item.status === 'waiting_pickup' && (
                    <TouchableOpacity style={s.confirmBtn} onPress={() => handleConfirmPickup(item.id)}>
                        <Text style={s.confirmText}>📦 Confirmer la remise</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={s.container}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <View style={s.header}>
                    <Text style={s.title}>Suivi des Équipements</Text>
                    <Text style={s.subtitle}>{equipments.length} équipement{equipments.length !== 1 ? 's' : ''} suivis</Text>
                </View>

                <FlatList
                    data={equipments}
                    renderItem={renderItem}
                    keyExtractor={i => i.id?.toString()}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    ListEmptyComponent={!loading && (
                        <View style={s.empty}>
                            <Text style={s.emptyIcon}>📋</Text>
                            <Text style={s.emptyTitle}>Aucun équipement à suivre</Text>
                            <Text style={s.emptyDesc}>Les équipements déposés par votre agence apparaîtront ici</Text>
                        </View>
                    )}
                />
            </ImageBackground>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
    title: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.3 },
    subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
    list: { padding: 20, paddingTop: 8 },
    // Card
    card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(148,163,184,0.06)' },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    icon: { fontSize: 20 },
    cardInfo: { flex: 1, marginLeft: 12 },
    name: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
    ref: { fontSize: 11, color: '#64748b', marginTop: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
    // Progress
    progressSection: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
    progressBar: { flex: 1, height: 4, backgroundColor: '#334155', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: 4, borderRadius: 2 },
    progressText: { fontSize: 11, color: '#64748b', fontWeight: '700', width: 34, textAlign: 'right' },
    // Timeline
    timeline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 4 },
    timelineDot: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4 },
    timelineLine: { width: 20, height: 2, marginHorizontal: 2 },
    // Depositor
    depositorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.06)' },
    depositorLabel: { fontSize: 12, color: '#64748b' },
    depositorName: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginLeft: 4 },
    // Date
    dateRow: { marginTop: 6 },
    dateLabel: { fontSize: 11, color: '#64748b' },
    // Confirm
    confirmBtn: { marginTop: 12, backgroundColor: '#22c55e', borderRadius: 10, padding: 12, alignItems: 'center' },
    confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    // Empty
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
    emptyDesc: { fontSize: 13, color: '#64748b', textAlign: 'center' },
});
