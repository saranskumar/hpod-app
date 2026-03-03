import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { useHexapodWebSocket, ControlIdx } from '../contexts/WebSocketContext';
import { Zap } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = [
    { id: 1, hex: '#ff2020' }, { id: 2, hex: '#00e060' }, { id: 3, hex: '#00e5ff' },
    { id: 4, hex: '#ffee00' }, { id: 5, hex: '#ffffff' }, { id: 6, hex: '#a020f0' },
    { id: 7, hex: '#ff00cc' }, { id: 8, hex: '#ff7700' }, { id: 9, hex: '#ff80b0' },
    { id: 10, hex: '#80ff30' }, { id: 11, hex: '#009090' }, { id: 12, hex: '#ffd700' },
    { id: 13, hex: '#cc80ff' },
];

const PATTERNS = [
    { id: 0, label: '●', title: 'Solid' },
    { id: 1, label: '◌', title: 'Breath' },
    { id: 2, label: '◉', title: 'Pulse 1' },
    { id: 3, label: '⊙', title: 'Pulse 2' },
];

interface Props {
    isLocked: boolean;
    setIsLocked: (l: boolean) => void;
}

export function CenterButtons({ isLocked, setIsLocked }: Props) {
    const { updateControlState } = useHexapodWebSocket();
    const [mState, setMState] = useState([false, false, false, false, false]);
    const [showLED, setShowLED] = useState(false);
    const [colorId, setColorId] = useState(5);
    const [patternId, setPatternId] = useState(0);

    const activeColor = COLORS.find(c => c.id === colorId)?.hex ?? '#ffffff';

    const toggleM = (index: number) => {
        const isAlreadyActive = mState[index];
        const next = [false, false, false, false, false];
        if (!isAlreadyActive) next[index] = true;
        setMState(next);
        updateControlState(ControlIdx.ACTIVE_MODE, isAlreadyActive ? 0 : index + 1);
    };

    const selectColor = (id: number) => { setColorId(id); updateControlState(ControlIdx.LED_COLOR, id); };
    const selectPattern = (id: number) => { setPatternId(id); updateControlState(ControlIdx.LED_PATTERN, id); };

    return (
        <View style={styles.container}>
            {/* Zap / LED button at top */}
            <TouchableOpacity
                activeOpacity={0.6}
                style={styles.zapBtn}
                onPress={() => setShowLED(v => !v)}
            >
                <View style={showLED ? {
                    shadowColor: activeColor === '#ffffff' ? '#a1a1aa' : activeColor,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 5,
                } : undefined}>
                    <Zap size={20} color={!showLED && activeColor === '#ffffff' ? '#71717a' : activeColor} />
                </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Mode Buttons */}
            <View style={[styles.group, { flex: 1, justifyContent: 'center', gap: 16 }]}>
                {mState.map((active, i) => (
                    <TouchableOpacity
                        key={`M${i}`}
                        activeOpacity={0.6}
                        style={styles.simpleModeBtn}
                        onPress={() => toggleM(i)}
                    >
                        <Text style={[styles.mText, {
                            color: active ? '#ef4444' : '#71717a',
                            textShadowColor: active ? 'rgba(239, 68, 68, 0.4)' : 'transparent',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: active ? 8 : 0
                        }]}>
                            M{i + 1}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* LED Settings MODAL */}
            <Modal visible={showLED} transparent={true} animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLED(false)}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                        <LinearGradient colors={['rgba(22,22,26,0.99)', 'rgba(14,14,18,1)']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFillObject} />
                        <View style={styles.modalBorder} />

                        <View style={{ padding: 16 }}>
                            <Text style={styles.sectionHeader}>PATTERN</Text>
                            <View style={styles.grid4}>
                                {PATTERNS.map(p => (
                                    <TouchableOpacity
                                        key={p.id}
                                        onPress={() => selectPattern(p.id)}
                                        style={[styles.gridBtn, {
                                            backgroundColor: patternId === p.id ? 'rgba(255,255,255,0.15)' : 'rgba(39, 39, 42, 0.7)',
                                            borderColor: patternId === p.id ? 'rgba(255,255,255,0.4)' : 'rgba(63, 63, 70, 0.4)'
                                        }]}
                                    >
                                        <Text style={{ color: patternId === p.id ? '#fff' : '#71717a', fontSize: 18 }}>{p.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.dividerH} />

                            <Text style={styles.sectionHeader}>COLOR</Text>
                            <View style={styles.grid7}>
                                {COLORS.map(c => (
                                    <TouchableOpacity
                                        key={c.id}
                                        onPress={() => selectColor(c.id)}
                                        style={[styles.dotBtn, {
                                            backgroundColor: c.hex,
                                            borderColor: colorId === c.id ? '#fff' : 'transparent',
                                            transform: [{ scale: colorId === c.id ? 1.2 : 1 }]
                                        }]}
                                    />
                                ))}
                                {/* Off btn */}
                                <TouchableOpacity
                                    onPress={() => selectColor(0)}
                                    style={[styles.dotBtn, {
                                        backgroundColor: '#222226',
                                        borderColor: colorId === 0 ? '#fff' : 'rgba(80, 80, 90, 0.6)',
                                        transform: [{ scale: colorId === 0 ? 1.2 : 1 }],
                                        justifyContent: 'center', alignItems: 'center'
                                    }]}
                                >
                                    <Text style={{ color: '#52525b', fontSize: 10, fontWeight: 'bold' }}>X</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    zapBtn: {
        width: '100%',
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    group: {
        width: '100%',
        alignItems: 'center',
        gap: 8,
    },
    divider: {
        width: '60%',
        height: 1,
        backgroundColor: 'rgba(63, 63, 70, 0.5)',
        marginVertical: 4,
    },
    simpleModeBtn: {
        height: 38,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mText: {
        fontFamily: 'monospace',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // Modal
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
    sectionHeader: { color: '#71717a', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
    grid4: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    gridBtn: { flex: 1, aspectRatio: 1, marginHorizontal: 4, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    dividerH: { height: 1, backgroundColor: 'rgba(63, 63, 70, 0.5)', marginBottom: 16 },
    grid7: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
    dotBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 2 },
});
