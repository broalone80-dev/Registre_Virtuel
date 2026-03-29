import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/authStore';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import EquipmentsScreen from '../screens/main/EquipmentsScreen';
import DepotScreen from '../screens/main/DepotScreen';
import DiagnosticsScreen from '../screens/main/DiagnosticsScreen';
import InterventionsScreen from '../screens/main/InterventionsScreen';
import SuiviScreen from '../screens/main/SuiviScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import UsersScreen from '../screens/main/UsersScreen';
import AgenciesScreen from '../screens/main/AgenciesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack pour les écrans "Plus" (admin)
function AdminMoreStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="UsersList" component={UsersScreen} />
            <Stack.Screen name="AgenciesList" component={AgenciesScreen} />
        </Stack.Navigator>
    );
}

const TAB_STYLE = {
    headerShown: false,
    tabBarActiveTintColor: '#3b82f6',
    tabBarInactiveTintColor: '#64748b',
    tabBarStyle: {
        backgroundColor: '#1e293b',
        borderTopColor: 'rgba(148,163,184,0.12)',
        borderTopWidth: 1,
        paddingBottom: 6,
        paddingTop: 6,
        height: 60,
    },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
};

export default function MainNavigator() {
    const user = useAuthStore((s) => s.user);
    const role = user?.role;
    const isAdmin = ['admin', 'super_admin'].includes(role);
    const isTechnician = role === 'technician';
    const isAgent = ['receptionist', 'agent'].includes(role);

    return (
        <Tab.Navigator screenOptions={TAB_STYLE}>
            {/* Dashboard — tous les rôles */}
            <Tab.Screen name="Dashboard" component={DashboardScreen}
                options={{ tabBarLabel: '🏠 Accueil' }} />

            {/* Agent : Dépôt + Suivi */}
            {isAgent && (
                <Tab.Screen name="Depot" component={DepotScreen}
                    options={{ tabBarLabel: '📦 Dépôt' }} />
            )}
            {isAgent && (
                <Tab.Screen name="Suivi" component={SuiviScreen}
                    options={{ tabBarLabel: '📋 Suivi' }} />
            )}

            {/* Technicien : Équipements + Diagnostics + Interventions */}
            {isTechnician && (
                <Tab.Screen name="Equipments" component={EquipmentsScreen}
                    options={{ tabBarLabel: '🖥️ Parc' }} />
            )}
            {isTechnician && (
                <Tab.Screen name="Diagnostics" component={DiagnosticsScreen}
                    options={{ tabBarLabel: '🔬 Diags' }} />
            )}
            {isTechnician && (
                <Tab.Screen name="Interventions" component={InterventionsScreen}
                    options={{ tabBarLabel: '🔧 Interv.' }} />
            )}

            {/* Admin : tout */}
            {isAdmin && (
                <Tab.Screen name="Equipments" component={EquipmentsScreen}
                    options={{ tabBarLabel: '🖥️ Parc' }} />
            )}
            {isAdmin && (
                <Tab.Screen name="Interventions" component={InterventionsScreen}
                    options={{ tabBarLabel: '🔧 Interv.' }} />
            )}
            {isAdmin && (
                <Tab.Screen name="Users" component={UsersScreen}
                    options={{ tabBarLabel: '👥 Users' }} />
            )}

            {/* Notifications — tous */}
            <Tab.Screen name="Notifications" component={NotificationsScreen}
                options={{ tabBarLabel: '🔔 Notifs' }} />

            {/* Profil — tous */}
            <Tab.Screen name="Profile" component={ProfileScreen}
                options={{ tabBarLabel: '👤 Profil' }} />
        </Tab.Navigator>
    );
}
