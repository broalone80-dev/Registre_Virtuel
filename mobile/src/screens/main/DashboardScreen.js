import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    TouchableOpacity, StatusBar, Animated, Dimensions, ImageBackground
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const user = useAuthStore((s) => s.user);
    const role = user?.role;
    const isAdmin = ['admin', 'super_admin'].includes(role);
    const isTechnician = role === 'technician';
    const isAgent = ['receptionist', 'agent'].includes(role);

    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ total: 0, inRepair: 0, diagnostics: 0, interventions: 0 });
    const [recentEquipments, setRecentEquipments] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    const loadData = useCallback(async () => {
        // Équipements
        try {
            const eqRes = await api.get('/equipments');
            const eqData = Array.isArray(eqRes) ? eqRes : eqRes?.data || [];
            setRecentEquipments(eqData.slice(0, 4));
            setStats(prev => ({
                ...prev,
                total: eqData.length,
                inRepair: eqData.filter(e => e.status === 'in_repair').length,
            }));
        } catch { }

        // Diagnostics
        try {
            const diagRes = await api.get('/diagnostics');
            const diagData = Array.isArray(diagRes) ? diagRes : diagRes?.data || [];
            setStats(prev => ({ ...prev, diagnostics: diagData.length }));
            setRecentActivities(diagData.slice(0, 5).map(d => ({
                id: d.id,
                title: d.fault_type || 'Diagnostic',
                desc: d.equipment ? `${d.equipment.brand} ${d.equipment.model}` : 'Équipement',
                status: (d.result && d.result !== 'pending') ? 'done' : 'pending',
                date: d.created_at,
            })));
        } catch { }

        // Interventions
        try {
            const intRes = await api.get('/interventions');
            const intData = Array.isArray(intRes) ? intRes : intRes?.data || [];
            setStats(prev => ({ ...prev, interventions: intData.length }));
        } catch { }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Bonjour';
        if (h < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    const getRoleLabel = () => {
        if (isAdmin) return 'Administrateur';
        if (isTechnician) return 'Technicien';
        return 'Agent Express Union';
    };

    const STATUS_MAP = {
        received: { label: 'Reçu', color: '#f59e0b', icon: '📥' },
        in_repair: { label: 'Réparation', color: '#f97316', icon: '🔧' },
        in_diagnostic: { label: 'Diagnostic', color: '#3b82f6', icon: '🔬' },
        waiting_diagnostic: { label: 'Att. diagnostic', color: '#f59e0b', icon: '⏳' },
        repaired: { label: 'Réparé', color: '#22c55e', icon: '✅' },
        waiting_pickup: { label: 'À récupérer', color: '#22c55e', icon: '📋' },
        delivered: { label: 'Livré', color: '#64748b', icon: '📦' },
    };

    // Role-based stat cards
    const getStatCards = () => {
        if (isAdmin) return [
            { label: 'Parc Global', value: stats.total, color: '#3b82f6', gradient: ['#1e40af', '#3b82f6'], icon: '🖥️' },
            { label: 'En Réparation', value: stats.inRepair, color: '#f97316', gradient: ['#c2410c', '#f97316'], icon: '🔧' },
            { label: 'Interventions', value: stats.interventions, color: '#8b5cf6', gradient: ['#6d28d9', '#8b5cf6'], icon: '⚡' },
        ];
        if (isTechnician) return [
            { label: 'Chantiers Actifs', value: stats.interventions, color: '#f97316', gradient: ['#c2410c', '#f97316'], icon: '🔧' },
            { label: 'Machines en panne', value: stats.inRepair, color: '#8b5cf6', gradient: ['#6d28d9', '#8b5cf6'], icon: '⚡' },
            { label: 'Mes Résolutions', value: stats.diagnostics, color: '#22c55e', gradient: ['#15803d', '#22c55e'], icon: '✅' },
        ];
        return [
            { label: 'Total Déposé', value: stats.total, color: '#3b82f6', gradient: ['#1e40af', '#3b82f6'], icon: '🖥️' },
            { label: 'Prêts à livrer', value: stats.diagnostics, color: '#22c55e', gradient: ['#15803d', '#22c55e'], icon: '✅' },
        ];
    };

    return (
        <View style={s.container}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <ScrollView
                    contentContainerStyle={s.scroll}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={['#3b82f6']} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={s.header}>
                        <View style={s.headerLeft}>
                            <Text style={s.greeting}>{getGreeting()} 👋</Text>
                            <Text style={s.userName}>{user?.first_name} {user?.last_name}</Text>
                            <View style={s.rolePill}>
                                <View style={[s.roleDot, { backgroundColor: isAdmin ? '#ef4444' : isTechnician ? '#f97316' : '#3b82f6' }]} />
                                <Text style={s.roleLabel}>{getRoleLabel()}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={s.avatarBtn} onPress={() => navigation?.navigate?.('Profile')}>
                            <Text style={s.avatarText}>{user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Quick Actions */}
                    <View style={s.quickActions}>
                        {isAgent && (
                            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => navigation?.navigate?.('Depot')}>
                                <Text style={s.actionIcon}>📦</Text>
                                <Text style={s.actionLabel}>Nouveau dépôt</Text>
                            </TouchableOpacity>
                        )}
                        {(isTechnician || isAdmin) && (
                            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#8b5cf6' }]} onPress={() => navigation?.navigate?.('Equipments')}>
                                <Text style={s.actionIcon}>🖥️</Text>
                                <Text style={s.actionLabel}>Voir le parc</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Stats Cards */}
                    <View style={s.statsSection}>
                        <Text style={s.sectionTitle}>📊 Vue d'ensemble</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsScroll}>
                            {getStatCards().map((card, i) => (
                                <View key={i} style={[s.statCard, { borderLeftColor: card.color, borderLeftWidth: 3 }]}>
                                    <View style={s.statCardInner}>
                                        <Text style={s.statIcon}>{card.icon}</Text>
                                        <View style={s.statInfo}>
                                            <Text style={[s.statValue, { color: card.color }]}>{card.value}</Text>
                                            <Text style={s.statLabel}>{card.label}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Recent Equipments */}
                    <View style={s.section}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>🖥️ Équipements récents</Text>
                            <TouchableOpacity onPress={() => navigation?.navigate?.('Equipments')}>
                                <Text style={s.seeAll}>Voir tout →</Text>
                            </TouchableOpacity>
                        </View>

                        {recentEquipments.length === 0 ? (
                            <View style={s.emptyCard}>
                                <Text style={s.emptyIcon}>📋</Text>
                                <Text style={s.emptyText}>Aucun équipement</Text>
                            </View>
                        ) : (
                            recentEquipments.map((eq, idx) => {
                                const st = STATUS_MAP[eq.status] || { label: eq.status, color: '#64748b', icon: '📦' };
                                return (
                                    <View key={eq.id || idx} style={s.eqCard}>
                                        <View style={[s.eqIconWrap, { backgroundColor: st.color + '15' }]}>
                                            <Text style={s.eqIcon}>{st.icon}</Text>
                                        </View>
                                        <View style={s.eqContent}>
                                            <Text style={s.eqName} numberOfLines={1}>{eq.brand} {eq.model}</Text>
                                            <Text style={s.eqRef}>{eq.reference || '—'}</Text>
                                        </View>
                                        <View style={[s.statusBadge, { backgroundColor: st.color + '15' }]}>
                                            <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>

                    {/* Activity Feed */}
                    <View style={s.section}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>⏱️ Activité récente</Text>
                            <View style={s.liveBadge}>
                                <View style={s.liveDot} />
                                <Text style={s.liveText}>En direct</Text>
                            </View>
                        </View>

                        {recentActivities.length === 0 ? (
                            <View style={s.emptyCard}>
                                <Text style={s.emptyIcon}>⏱️</Text>
                                <Text style={s.emptyText}>Pas d'activité récente</Text>
                            </View>
                        ) : (
                            recentActivities.map((act, idx) => (
                                <View key={act.id || idx} style={s.actCard}>
                                    <View style={[s.actDot, { backgroundColor: act.status === 'done' ? '#22c55e' : '#f59e0b' }]} />
                                    <View style={s.actContent}>
                                        <Text style={s.actTitle}>{act.title}</Text>
                                        <Text style={s.actDesc}>{act.desc}</Text>
                                    </View>
                                    <View style={s.actMeta}>
                                        <View style={[s.actTag, { backgroundColor: act.status === 'done' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)' }]}>
                                            <Text style={[s.actTagText, { color: act.status === 'done' ? '#22c55e' : '#f59e0b' }]}>
                                                {act.status === 'done' ? 'TERMINÉ' : 'EN COURS'}
                                            </Text>
                                        </View>
                                        <Text style={s.actDate}>{act.date ? new Date(act.date).toLocaleDateString('fr-FR') : ''}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </ImageBackground>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
    scroll: { paddingBottom: 20 },
    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
    headerLeft: { flex: 1 },
    greeting: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
    userName: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginTop: 2, letterSpacing: -0.3 },
    rolePill: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: 'rgba(148,163,184,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
    roleDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    roleLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.3 },
    avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e40af', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(59,130,246,0.3)' },
    avatarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
    // Quick Actions
    quickActions: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
    actionIcon: { fontSize: 18 },
    actionLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
    // Stats
    statsSection: { marginTop: 24 },
    statsScroll: { paddingHorizontal: 20, gap: 10 },
    statCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, width: 160, borderWidth: 1, borderColor: 'rgba(148,163,184,0.08)' },
    statCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statIcon: { fontSize: 28 },
    statInfo: {},
    statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 1, letterSpacing: 0.2 },
    // Sections
    section: { marginTop: 24, paddingHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
    seeAll: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
    // Equipment Cards
    eqCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(148,163,184,0.08)' },
    eqIconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    eqIcon: { fontSize: 18 },
    eqContent: { flex: 1, marginLeft: 12 },
    eqName: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
    eqRef: { fontSize: 11, color: '#64748b', marginTop: 2, letterSpacing: 0.3 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
    // Activity
    actCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(148,163,184,0.08)' },
    actDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 12 },
    actContent: { flex: 1 },
    actTitle: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
    actDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    actMeta: { alignItems: 'flex-end' },
    actTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    actTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    actDate: { fontSize: 10, color: '#64748b', marginTop: 4 },
    // Live badge
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e', marginRight: 5 },
    liveText: { fontSize: 10, color: '#22c55e', fontWeight: '700' },
    // Empty
    emptyCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(148,163,184,0.08)' },
    emptyIcon: { fontSize: 32, marginBottom: 8 },
    emptyText: { fontSize: 13, color: '#64748b' },
});
