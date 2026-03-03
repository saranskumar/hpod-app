import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface Props extends ViewProps {
    style?: ViewStyle | ViewStyle[];
    children?: React.ReactNode;
}

export function ClayPanel({ style, children, ...props }: Props) {
    return (
        <View style={[styles.container, style]} {...props}>
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFillObject} />
            <LinearGradient
                colors={['rgba(39,39,42,0.85)', 'rgba(24,24,27,0.75)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            {children}
            {/* The border overlay goes on top so the inset highlight is visible */}
            <View style={styles.borderOverlay} pointerEvents="none" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        overflow: 'hidden',
        // approximate box-shadow: 0 8px 32px 0 rgba(0,0,0,0.45)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 10,
    },
    borderOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(63,63,70,0.35)',
        borderTopWidth: 1.5,
        borderTopColor: 'rgba(255,255,255,0.06)', // fake inset shadow from web
    },
});
