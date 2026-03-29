import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl,
    TouchableOpacity, StatusBar, ImageBackground
} from 'react-native';
import api from '../../services/api';

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await api.get('/notifications?limit=50');
            const data = Array.isArray(res) ? res : res?.data || [];
            setNotifications(data);
        } catch (e) { console.log(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}`, { is_read: true });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch { }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch { }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const TYPE_CONFIG = {
        equipment: { icon: '🖥️', color: '#3b82f6' },
        intervention: { icon: '🔧', color: '#f97316' },
        diagnostic: { icon: '🔬', color: '#8b5cf6' },
        alert: { icon: '⚠️', color: '#ef4444' },
        info: { icon: 'ℹ️', color: '#3b82f6' },
        system: { icon: '⚙️', color: '#64748b' },
    };

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'À l\'instant';
        if (mins < 60) return `${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}j`;
        return new Date(date).toLocaleDateString('fr-FR');
    };

    const renderItem = ({ item }) => {
        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
        return (
            <TouchableOpacity
                style={[s.card, !item.is_read && s.cardUnread]}
                onPress={() => markAsRead(item.id)}
                activeOpacity={0.7}
            >
                <View style={[s.iconWrap, { backgroundColor: cfg.color + '12' }]}>
                    <Text style={s.icon}>{cfg.icon}</Text>
                </View>
                <View style={s.content}>
                    <View style={s.contentTop}>
                        <Text style={s.title} numberOfLines={1}>{item.title || 'Notification'}</Text>
                        {!item.is_read && <View style={s.unreadDot} />}
                    </View>
                    <Text style={s.message} numberOfLines={2}>{item.message}</Text>
                    <Text style={s.time}>{timeAgo(item.created_at)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={s.container}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <View style={s.header}>
                    <View>
                        <Text style={s.headerTitle}>Notifications</Text>
                        <Text style={s.headerSub}>
                            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
                        </Text>
                    </View>
                    {unreadCount > 0 && (
                        <TouchableOpacity style={s.markAllBtn} onPress={markAllRead}>
                            <Text style={s.markAllText}>Tout marquer lu</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={i => i.id?.toString()}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    ListEmptyComponent={!loading && (
                        <View style={s.empty}>
                            <Text style={s.emptyIcon}>🔔</Text>
                            <Text style={s.emptyTitle}>Aucune notification</Text>
                            <Text style={s.emptyDesc}>Vous serez notifié des mises à jour importantes</Text>
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
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.3 },
    headerSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
    markAllBtn: { backgroundColor: 'rgba(59,130,246,0.12)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
    markAllText: { fontSize: 12, color: '#3b82f6', fontWeight: '700' },
    list: { padding: 20, paddingTop: 8 },
    // Card
    card: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(148,163,184,0.06)' },
    cardUnread: { borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
    iconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    icon: { fontSize: 18 },
    content: { flex: 1 },
    contentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 14, fontWeight: '700', color: '#f1f5f9', flex: 1 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginLeft: 8 },
    message: { fontSize: 13, color: '#94a3b8', marginTop: 3, lineHeight: 18 },
    time: { fontSize: 11, color: '#475569', marginTop: 4, fontWeight: '500' },
    // Empty
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
    emptyDesc: { fontSize: 13, color: '#64748b', textAlign: 'center' },
});
