import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { CustomSlider } from './CustomSlider';
import { ControlIdx } from '../contexts/WebSocketContext';

export function RightBottomRotation() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.dirText}>◂ LEFT</Text>
                <Text style={styles.titleText}>YAW ROTATION</Text>
                <Text style={styles.dirText}>RIGHT ▸</Text>
            </View>

            <View style={styles.sliderWrapper}>
                <CustomSlider
                    controlIdx={ControlIdx.YAW_ROTATION}
                    width={'100%'}
                    height={28}
                    color="rgba(228, 228, 231, 0.9)" // zinc-200
                    autoCenter={true}
                    vertical={false}
                    min={-1}
                    max={1}
                    thumbScale={1.6}
                />
            </View>

            <Text style={styles.footerText}>AUTO-CENTERS ON RELEASE</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginTop: 6,
    },
    sliderWrapper: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dirText: {
        color: '#71717a',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    titleText: {
        color: '#a1a1aa',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    footerText: {
        color: '#52525b',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 2,
    }
});
