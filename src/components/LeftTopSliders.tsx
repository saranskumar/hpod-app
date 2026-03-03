import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Modal, TouchableOpacityProps } from 'react-native';
import { CustomSlider } from './CustomSlider';
import { useHexapodWebSocket, ControlIdx, ConnectionState } from '../contexts/WebSocketContext';
import { Wifi, CheckCircle2, ShieldAlert, RefreshCcw, PlugZap, Lock, Unlock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    isLocked?: boolean;
    setIsLocked?: (l: boolean) => void;
}




export function LeftTopSliders({ isLocked, setIsLocked }: Props) {
    const { updateControlState, wsUrl, setWsUrl, connectionState } = useHexapodWebSocket();

    const [showESP, setShowESP] = useState(false);
    const [ipInput, setIpInput] = useState('192.168.31.118');

    const isConnected = connectionState === ConnectionState.OPEN;
    const isConnecting = connectionState === ConnectionState.CONNECTING;

    return (
        <View style={styles.container}>
            {/* Sliders row */}
            <View style={styles.sliderRow}>
                {/* Slider columns — blocked when locked */}
                <View style={{ flex: 3, flexDirection: 'row', gap: 24 }} pointerEvents={isLocked ? 'none' : 'auto'}>
                    <View style={styles.sliderCol}>
                        <Text style={styles.sliderLabel}>Z HGT</Text>
                        <View style={styles.sliderWrapper}>
                            <CustomSlider controlIdx={ControlIdx.Z} width={24} height={'100%'} color="rgba(228,228,231,0.9)" autoCenter={false} vertical={true} min={1} max={10} />
                        </View>
                    </View>

                    <View style={styles.sliderCol}>
                        <Text style={styles.sliderLabel}>Y TLT</Text>
                        <View style={styles.sliderWrapper}>
                            <CustomSlider controlIdx={ControlIdx.Y} width={24} height={'100%'} color="rgba(228,228,231,0.9)" autoCenter={false} vertical={true} min={1} max={10} />
                        </View>
                    </View>

                    <View style={styles.sliderCol}>
                        <Text style={styles.sliderLabel}>SPEED</Text>
                        <View style={styles.sliderWrapper}>
                            <CustomSlider controlIdx={ControlIdx.SPEED} width={24} height={'100%'} color="rgba(228,228,231,0.9)" autoCenter={false} vertical={true} min={1} max={10} />
                        </View>
                    </View>
                </View>

                {/* 4th Column for Buttons */}
                <View style={styles.sliderCol}>
                    <Text style={styles.sliderLabel}>SYS</Text>
                    <View style={{ flex: 1, justifyContent: 'space-evenly', alignItems: 'center' }}>
                        <TouchableOpacity
                            activeOpacity={0.6}
                            style={{ width: 44, height: 38, alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => setShowESP(v => !v)}
                        >
                            <View style={(showESP || isConnected) ? {
                                shadowColor: '#34d399',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.8,
                                shadowRadius: 10,
                                elevation: 5,
                            } : undefined}>
                                <Wifi size={18} color={isConnected ? '#34d399' : showESP ? '#fff' : '#71717a'} />
                            </View>
                        </TouchableOpacity>

                        {/* Lock Button */}
                        <TouchableOpacity
                            activeOpacity={0.6}
                            style={{ width: 44, height: 38, alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => setIsLocked && setIsLocked(!isLocked)}
                        >
                            <View style={isLocked ? {
                                shadowColor: '#fbbf24',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.8,
                                shadowRadius: 12,
                                elevation: 5,
                            } : undefined}>
                                {isLocked ? <Lock size={18} color="#fbbf24" /> : <Unlock size={18} color="#71717a" />}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* ESP WiFi MODAL */}
            <Modal visible={showESP} transparent={true} animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowESP(false)}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={() => { /* Swallows touch to prevent closing */ }}>
                        <LinearGradient colors={['rgba(22,22,26,0.99)', 'rgba(14,14,18,1)']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFillObject} />
                        <View style={styles.modalBorder} />

                        <View style={{ padding: 16 }}>
                            <View style={[styles.statusBox, {
                                backgroundColor: isConnected ? 'rgba(52, 211, 153, 0.1)' : isConnecting ? 'rgba(251, 191, 36, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                borderColor: isConnected ? 'rgba(52, 211, 153, 0.3)' : isConnecting ? 'rgba(251, 191, 36, 0.3)' : 'rgba(248, 113, 113, 0.3)'
                            }]}>
                                {isConnected ? (
                                    <>
                                        <CheckCircle2 size={24} color="#34d399" />
                                        <Text style={styles.statusLabelGreen}>CONNECTED</Text>
                                        <Text style={styles.statusSub}>{wsUrl}</Text>
                                    </>
                                ) : isConnecting ? (
                                    <>
                                        <RefreshCcw size={24} color="#fbbf24" />
                                        <Text style={styles.statusLabelAmber}>CONNECTING...</Text>
                                    </>
                                ) : (
                                    <>
                                        <ShieldAlert size={24} color="#f87171" />
                                        <Text style={styles.statusLabelRed}>OFFLINE</Text>
                                    </>
                                )}
                            </View>

                            <TouchableOpacity style={styles.presetBtn} onPress={() => { setWsUrl('ws://hexapod.local:81/'); setShowESP(false); }}>
                                <PlugZap size={14} color="#34d399" />
                                <Text style={styles.presetText}>auto: hexapod.local</Text>
                            </TouchableOpacity>

                            <TextInput
                                style={styles.input}
                                value={ipInput}
                                onChangeText={setIpInput}
                                placeholder="192.168.X.X"
                                placeholderTextColor="#52525b"
                            />
                            <TouchableOpacity
                                style={styles.connectBtn}
                                onPress={() => { setWsUrl(`ws://${ipInput}:81/`); setShowESP(false); }}
                            >
                                <Text style={styles.connectText}>CONNECT TO IP</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>


        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 14,
        paddingHorizontal: 16,
        paddingBottom: 12,
        alignItems: 'stretch',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    topRightBtns: {
        flexDirection: 'row',
        gap: 6,
        position: 'absolute',
        right: 0,
        top: -6,
    },
    headerText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        color: '#52525b',
    },
    lockedBadge: {
        backgroundColor: 'rgba(245,158,11,0.1)',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.3)',
    },
    lockedText: {
        fontSize: 8,
        color: '#f59e0b',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    sliderRow: {
        flex: 1,
        flexDirection: 'row',
        gap: 24,
        justifyContent: 'center',
    },
    sliderCol: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    sliderLabel: {
        fontSize: 10,
        color: '#a1a1aa',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    sliderWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingBottom: 4,
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: 300,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 40 },
        shadowOpacity: 0.95,
        shadowRadius: 100,
        elevation: 20,
    },
    modalBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(80, 80, 90, 0.5)',
        borderTopWidth: 1.5,
        borderTopColor: 'rgba(255,255,255,0.07)',
        pointerEvents: 'none',
    },
    statusBox: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 16,
        gap: 4,
    },
    statusLabelGreen: { color: '#34d399', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
    statusLabelAmber: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
    statusLabelRed: { color: '#f87171', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
    statusSub: { color: '#059669', fontSize: 10, fontFamily: 'monospace' },

    presetBtn: {
        flexDirection: 'row',
        backgroundColor: 'rgba(52, 211, 153, 0.12)',
        borderColor: 'rgba(52, 211, 153, 0.3)',
        borderWidth: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    presetText: { color: '#34d399', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

    input: {
        backgroundColor: 'rgba(39, 39, 42, 0.7)',
        color: '#e4e4e7',
        borderColor: 'rgba(63, 63, 70, 0.5)',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontFamily: 'monospace',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
    connectBtn: {
        backgroundColor: 'rgba(228, 228, 231, 0.9)',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    connectText: {
        color: '#09090b',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },

    sectionHeader: { color: '#71717a', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
    grid4: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    gridBtn: { flex: 1, aspectRatio: 1, marginHorizontal: 4, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    dividerH: { height: 1, backgroundColor: 'rgba(63, 63, 70, 0.5)', marginBottom: 16 },
    grid7: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
    dotBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 2 },
});
