import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { useHexapodWebSocket, ConnectionState } from '../contexts/WebSocketContext';
import { CheckCircle2, ShieldAlert, RefreshCcw } from 'lucide-react-native';

export function TopMenu() {
    const { connectionState, toggleConnection } = useHexapodWebSocket();

    const isConnected = connectionState === ConnectionState.OPEN;
    const isConnecting = connectionState === ConnectionState.CONNECTING;

    const getStatusText = () => {
        if (isConnected) return 'WIFI: ONLINE';
        if (isConnecting) return 'WIFI: CONNECTING';
        return 'WIFI: OFFLINE';
    };

    return (
        <View style={styles.container}>
            {/* Logo + Name */}
            <View style={styles.logoGroup}>
                <Image
                    source={require('../../assets/icon.png')}
                    style={styles.logoImage}
                    resizeMode="cover"
                />
                <Text style={styles.title}>ATOM</Text>
            </View>

            {/* Connection status */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggleConnection}
                style={[styles.statusBadge, {
                    backgroundColor: isConnected ? 'rgba(52, 211, 153, 0.12)' : isConnecting ? 'rgba(251, 191, 36, 0.12)' : 'rgba(248, 113, 113, 0.12)',
                    borderColor: isConnected ? 'rgba(52, 211, 153, 0.3)' : isConnecting ? 'rgba(251, 191, 36, 0.3)' : 'rgba(248, 113, 113, 0.3)'
                }]}>
                {isConnected ? <CheckCircle2 size={11} color="#34d399" /> :
                    isConnecting ? <RefreshCcw size={11} color="#fbbf24" /> :
                        <ShieldAlert size={11} color="#f87171" />
                }
                <Text style={[styles.statusText, {
                    color: isConnected ? '#34d399' : isConnecting ? '#fbbf24' : '#f87171'
                }]}>
                    {getStatusText()}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 5,
        backgroundColor: 'rgba(24, 24, 27, 0.5)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    logoGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoImage: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        color: '#a1a1aa',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
