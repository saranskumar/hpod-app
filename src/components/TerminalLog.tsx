import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useHexapodWebSocket, ControlIdx } from '../contexts/WebSocketContext';
import { Trash2 } from 'lucide-react-native';

export function TerminalLog() {
    const { updateControlState, getControlSnapshot, logs, clearLogs } = useHexapodWebSocket();
    const scrollRef = useRef<ScrollView>(null);

    // We snapshot floats primarily for the debugger view
    const [floats, setFloats] = useState<Float32Array>(getControlSnapshot());

    // Manual editing state for the header floats
    const [editingField, setEditingField] = useState<{ id: string, val: string } | null>(null);

    // Rapid visual poll for the debug tracker, decoupled from the underlying logic
    useEffect(() => {
        const intervalId = setInterval(() => {
            setFloats(getControlSnapshot());
        }, 50); // 20Hz visual refresh
        return () => clearInterval(intervalId);
    }, [getControlSnapshot]);

    // Helper to render an editable float cell
    const renderFloat = (label: string, id: string, idx: ControlIdx, isEditable = true) => {
        const isEditing = editingField?.id === id;
        const valStr = floats[idx].toFixed(2);

        return (
            <TouchableOpacity
                style={styles.floatCell}
                activeOpacity={isEditable ? 0.6 : 1}
                disabled={!isEditable}
                onPress={() => setEditingField({ id, val: valStr })}
            >
                <Text style={styles.floatLabel}>{label}:</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.floatInput}
                        autoFocus
                        keyboardType="numeric"
                        defaultValue={valStr}
                        onBlur={() => setEditingField(null)}
                        onSubmitEditing={(e) => {
                            const v = parseFloat(e.nativeEvent.text);
                            if (!isNaN(v)) updateControlState(idx, v);
                            setEditingField(null);
                        }}
                    />
                ) : (
                    <Text style={[styles.floatVal, isEditable && { color: '#38bdf8' }]}>{valStr}</Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header / Float Debugger */}
            <View style={styles.header}>
                <View style={styles.floatGrid}>
                    <View style={styles.floatRow}>
                        {renderFloat('AX', 'ax', ControlIdx.AX, false)}
                        {renderFloat('AY', 'ay', ControlIdx.AY, false)}
                        {renderFloat('Z', 'z', ControlIdx.Z, true)}
                        {renderFloat('Y', 'y', ControlIdx.Y, true)}
                        {renderFloat('YAW', 'yaw', ControlIdx.YAW_ROTATION, true)}
                    </View>
                    <View style={styles.floatRow}>
                        {renderFloat('SPD', 'spd', ControlIdx.SPEED, true)}
                        {renderFloat('LED', 'led', ControlIdx.LED_COLOR, true)}
                        {renderFloat('PAT', 'pat', ControlIdx.LED_PATTERN, true)}
                        {renderFloat('MOD', 'mod', ControlIdx.ACTIVE_MODE, true)}
                    </View>
                </View>

                <TouchableOpacity onPress={clearLogs} style={styles.clearBtn}>
                    <Trash2 size={12} color="#71717a" />
                </TouchableOpacity>
            </View>

            {/* Scrolling log list */}
            <ScrollView
                ref={scrollRef}
                style={styles.scroller}
                contentContainerStyle={styles.scrollContent}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => scrollRef.current?.scrollToEnd({ animated: false })}
                showsVerticalScrollIndicator={false}
            >
                {logs.map(log => {
                    let color = '#a1a1aa';
                    if (log.type === 'warn') color = '#fbbf24';
                    if (log.type === 'error') color = '#ef4444';
                    if (log.type === 'recv') color = '#34d399';
                    if (log.type === 'info') color = '#38bdf8';

                    return (
                        <View key={log.id} style={styles.logRow}>
                            <Text style={styles.logTime}>[{log.time}]</Text>
                            <Text style={[styles.logMsg, { color }]}>{log.msg}</Text>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        gap: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(63, 63, 70, 0.5)',
        paddingBottom: 8,
    },
    floatGrid: {
        flex: 1,
        gap: 2,
    },
    floatRow: {
        flexDirection: 'row',
        gap: 8,
    },
    floatCell: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    floatLabel: {
        color: '#71717a',
        fontSize: 8,
        fontFamily: 'monospace',
        fontWeight: 'bold',
    },
    floatVal: {
        color: '#e4e4e7',
        fontSize: 8,
        fontFamily: 'monospace',
        minWidth: 24,
    },
    floatInput: {
        backgroundColor: '#18181b',
        color: '#34d399',
        fontSize: 8,
        fontFamily: 'monospace',
        minWidth: 24,
        padding: 0,
        margin: 0,
        height: 12,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#38bdf8',
        textAlign: 'center',
    },
    clearBtn: {
        padding: 4,
        backgroundColor: 'rgba(63, 63, 70, 0.3)',
        borderRadius: 6,
    },
    scroller: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 4,
    },
    logRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 2,
    },
    logTime: {
        color: '#52525b',
        fontSize: 9,
        fontFamily: 'monospace',
    },
    logMsg: {
        flex: 1,
        fontSize: 9,
        fontFamily: 'monospace',
    }
});
