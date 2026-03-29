import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl,
    TouchableOpacity, TextInput, StatusBar, ImageBackground
} from 'react-native';
import api from '../../services/api';

const STATUS_MAP = {
    available: { label: 'Disponible', color: '#22c55e', icon: '✅' },
    received: { label: 'Reçu', color: '#f59e0b', icon: '📥' },
    in_repair: { label: 'En réparation', color: '#f97316', icon: '🔧' },
    repaired: { label: 'Réparé', color: '#22c55e', icon: '✅' },
    waiting_pickup: { label: 'Prêt', color: '#10b981', icon: '📋' },
    in_transit: { label: 'En transit', color: '#f59e0b', icon: '🚚' },
    in_diagnostic: { label: 'Diagnostic', color: '#3b82f6', icon: '🔬' },
    waiting_diagnostic: { label: 'Att. diagnostic', color: '#f59e0b', icon: '⏳' },
    delivered: { label: 'Livré', color: '#64748b', icon: '📦' },
};

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', normal: '#f59e0b', low: '#22c55e' };

export default function EquipmentsScreen() {
    const [equipments, setEquipments] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const load = async () => {
        try {
            const res = await api.get('/equipments');
            const data = Array.isArray(res) ? res : res?.data || [];
            setEquipments(data);
            setFiltered(data);
        } catch (e) { console.log(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    // Filters
    useEffect(() => {
        let result = [...equipments];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(e =>
                (e.brand + ' ' + e.model).toLowerCase().includes(q) ||
                e.reference?.toLowerCase().includes(q) ||
                e.serial_number?.toLowerCase().includes(q)
            );
        }
        if (activeFilter !== 'all') {
            result = result.filter(e => e.status === activeFilter);
        }
        setFiltered(result);
    }, [search, activeFilter, equipments]);

    const FILTERS = [
        { key: 'all', label: 'Tous' },
        { key: 'received', label: 'Reçus' },
        { key: 'in_repair', label: 'Réparation' },
        { key: 'repaired', label: 'Réparés' },
        { key: 'waiting_pickup', label: 'Prêts' },
    ];

    const renderItem = ({ item }) => {
        const st = STATUS_MAP[item.status] || { label: item.status, color: '#64748b', icon: '📦' };
        const prioColor = PRIORITY_COLORS[item.priority] || '#f59e0b';
        return (
            <View style={s.card}>
                <View style={s.cardLeft}>
                    <View style={[s.iconWrap, { backgroundColor: st.color + '12' }]}>
                        <Text style={s.icon}>{st.icon}</Text>
                    </View>
                </View>
                <View style={s.cardContent}>
                    <View style={s.cardRow}>
                        <Text style={s.name} numberOfLines={1}>{item.brand} {item.model}</Text>
                        {item.priority && (
                            <View style={[s.prioDot, { backgroundColor: prioColor }]} />
                        )}
                    </View>
                    <Text style={s.ref}>{item.reference || '—'}</Text>
                    {item.serial_number && <Text style={s.serial}>S/N: {item.serial_number}</Text>}
                    <View style={s.cardBottom}>
                        <View style={[s.statusBadge, { backgroundColor: st.color + '15' }]}>
                            <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                        {item.agency && (
                            <Text style={s.agency}>🏢 {item.agency.name}</Text>
                        )}
                    </View>
                </View>
                <Text style={s.chevron}>›</Text>
            </View>
        );
    };

    const countByStatus = (status) => equipments.filter(e => e.status === status).length;

    return (
        <View style={s.container}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                {/* Header */}
                <View style={s.header}>
                    <View style={s.headerTop}>
                        <View>
                            <Text style={s.title}>Parc Équipements</Text>
                            <Text style={s.subtitle}>{equipments.length} équipement{equipments.length !== 1 ? 's' : ''} au total</Text>
                        </View>
                    </View>

                    {/* Search */}
                    <View style={s.searchWrap}>
                        <Text style={s.searchIcon}>🔍</Text>
                        <TextInput
                            style={s.searchInput}
                            placeholder="Rechercher marque, modèle, référence..."
                            placeholderTextColor="#475569"
                            value={search}
                            onChangeText={setSearch}
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Text style={s.clearBtn}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter chips */}
                    <FlatList
                        horizontal
                        data={FILTERS}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={f => f.key}
                        contentContainerStyle={s.filters}
                        renderItem={({ item: f }) => (
                            <TouchableOpacity
                                style={[s.filterChip, activeFilter === f.key && s.filterChipActive]}
                                onPress={() => setActiveFilter(f.key)}
                            >
                                <Text style={[s.filterText, activeFilter === f.key && s.filterTextActive]}>
                                    {f.label} {f.key !== 'all' ? `(${countByStatus(f.key)})` : `(${equipments.length})`}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                <FlatList
                    data={filtered}
                    renderItem={renderItem}
                    keyExtractor={i => i.id?.toString()}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    ListEmptyComponent={!loading && (
                        <View style={s.empty}>
                            <Text style={s.emptyIcon}>📋</Text>
                            <Text style={s.emptyText}>{search ? 'Aucun résultat' : 'Aucun équipement'}</Text>
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
    header: { paddingTop: 56, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.08)' },
    headerTop: { paddingHorizontal: 20, marginBottom: 12 },
    title: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.3 },
    subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
    // Search
    searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(148,163,184,0.08)' },
    searchIcon: { fontSize: 14, marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, color: '#f1f5f9', fontSize: 14 },
    clearBtn: { color: '#64748b', fontSize: 14, padding: 4 },
    // Filters
    filters: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#1e293b', borderWidth: 1, borderColor: 'rgba(148,163,184,0.08)' },
    filterChipActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
    filterText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
    filterTextActive: { color: '#3b82f6' },
    // List
    list: { padding: 20, paddingTop: 8 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(148,163,184,0.06)' },
    cardLeft: { marginRight: 12 },
    iconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    icon: { fontSize: 20 },
    cardContent: { flex: 1 },
    cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    name: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', flex: 1 },
    prioDot: { width: 8, height: 8, borderRadius: 4 },
    ref: { fontSize: 11, color: '#64748b', marginTop: 2, letterSpacing: 0.3 },
    serial: { fontSize: 10, color: '#475569', marginTop: 1, fontFamily: 'monospace' },
    cardBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
    agency: { fontSize: 10, color: '#64748b' },
    chevron: { fontSize: 20, color: '#475569', marginLeft: 4 },
    // Empty
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyIcon: { fontSize: 32, marginBottom: 8 },
    emptyText: { fontSize: 13, color: '#64748b' },
});
