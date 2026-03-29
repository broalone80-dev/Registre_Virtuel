import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Alert, StatusBar, ScrollView, ImageBackground
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const role = user?.role;
    const isAdmin = ['admin', 'super_admin'].includes(role);
    const isTechnician = role === 'technician';

    const handleLogout = () => {
        Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se déconnecter', style: 'destructive', onPress: logout },
        ]);
    };

    const ROLE_CONFIG = {
        admin: { label: 'Administrateur', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
        super_admin: { label: 'Super Admin', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
        technician: { label: 'Technicien', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
        receptionist: { label: 'Agent Express Union', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
        agent: { label: 'Agent Express Union', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    };

    const rc = ROLE_CONFIG[role] || ROLE_CONFIG.agent;

    const MENU_ITEMS = [
        { icon: '👤', label: 'Informations personnelles', sub: `${user?.email}` },
        { icon: '📱', label: 'Téléphone', sub: user?.phone || 'Non renseigné' },
        { icon: '🏢', label: 'Agence', sub: user?.agency_id ? 'Agence assignée' : 'Aucune agence' },
        { icon: '🕐', label: 'Dernière connexion', sub: user?.last_login_at ? new Date(user.last_login_at).toLocaleString('fr-FR') : 'Maintenant' },
    ];

    return (
        <View style={s.container}>
            <ImageBackground source={require('../../assets/background.jpg')} style={s.bgImage}>
                <View style={s.bgOverlay} />
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                    {/* Profile Card */}
                    <View style={s.profileCard}>
                        <View style={s.profileBg}>
                            <View style={[s.avatar, { borderColor: rc.color + '40' }]}>
                                <Text style={s.avatarText}>{user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}</Text>
                            </View>
                        </View>
                        <Text style={s.name}>{user?.first_name} {user?.last_name}</Text>
                        <Text style={s.email}>{user?.email}</Text>
                        <View style={[s.rolePill, { backgroundColor: rc.bg }]}>
                            <View style={[s.roleDot, { backgroundColor: rc.color }]} />
                            <Text style={[s.roleText, { color: rc.color }]}>{rc.label}</Text>
                        </View>
                    </View>

                    {/* Info Section */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Informations</Text>
                        {MENU_ITEMS.map((item, idx) => (
                            <View key={idx} style={[s.menuItem, idx === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 }]}>
                                <Text style={s.menuIcon}>{item.icon}</Text>
                                <View style={s.menuContent}>
                                    <Text style={s.menuLabel}>{item.label}</Text>
                                    <Text style={s.menuSub}>{item.sub}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* App Info */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Application</Text>
                        <View style={s.menuItem}>
                            <Text style={s.menuIcon}>📱</Text>
                            <View style={s.menuContent}>
                                <Text style={s.menuLabel}>Version</Text>
                                <Text style={s.menuSub}>1.0.0</Text>
                            </View>
                        </View>
                        <View style={[s.menuItem, { borderBottomWidth: 0 }]}>
                            <Text style={s.menuIcon}>🏗️</Text>
                            <View style={s.menuContent}>
                                <Text style={s.menuLabel}>API</Text>
                                <Text style={s.menuSub}>Connecté</Text>
                            </View>
                            <View style={s.connectedDot} />
                        </View>
                    </View>

                    {/* Logout */}
                    <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                        <Text style={s.logoutIcon}>🚪</Text>
                        <Text style={s.logoutText}>Se déconnecter</Text>
                    </TouchableOpacity>

                    <Text style={s.copyright}>© 2026 Registre Virtuel · Express Union</Text>
                </ScrollView>
            </ImageBackground>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
    scroll: { paddingBottom: 40 },
    // Profile Card
    profileCard: { alignItems: 'center', paddingTop: 56, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.06)' },
    profileBg: { marginBottom: 16 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e40af', justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
    avatarText: { fontSize: 26, fontWeight: '800', color: '#fff' },
    name: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.3 },
    email: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
    rolePill: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
    roleDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    roleText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
    // Section
    section: { marginTop: 20, marginHorizontal: 20, backgroundColor: '#1e293b', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(148,163,184,0.06)' },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5, textTransform: 'uppercase', padding: 16, paddingBottom: 4 },
    // Menu Items
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.06)' },
    menuIcon: { fontSize: 18, marginRight: 14 },
    menuContent: { flex: 1 },
    menuLabel: { fontSize: 14, fontWeight: '600', color: '#f1f5f9' },
    menuSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
    connectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
    // Logout
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 24, paddingVertical: 16, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)', gap: 10 },
    logoutIcon: { fontSize: 18 },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
    // Copyright
    copyright: { fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 24, letterSpacing: 0.3 },
});
