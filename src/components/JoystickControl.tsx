import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { useControlSurface } from './ControlSurface';

interface Props {
    size?: number;
    color?: string;
}

export function JoystickControl({ size = 180, color = 'rgba(158, 188, 188, 0.8)' }: Props) {
    const { registerZone, joystickState } = useControlSurface();
    const { x: translateX, y: translateY, isPressed } = joystickState;
    const maxRadius = size / 2 - 25; // thumb radius is 25

    // Base appears dynamically when pressed
    const baseStyle = useAnimatedStyle(() => {
        // originX and originY are relative to the top-left of the JoystickControl container.
        // We need to offset by size/2 so the center of the base sits at the touch origin.
        const ox = joystickState.originX.value - (size / 2);
        const oy = joystickState.originY.value - (size / 2);

        return {
            opacity: withSpring(isPressed.value ? 1 : 0, { damping: 20, stiffness: 200 }),
            transform: [
                { translateX: ox },
                { translateY: oy },
                { scale: withSpring(isPressed.value ? 1 : 0.8) }
            ],
            // Default position when opacity is 0 isn't very important, but keeping it 0,0 is fine
            left: 0,
            top: 0
        };
    });

    const thumbStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: withSpring(isPressed.value ? 0.95 : 1) },
            ],
            backgroundColor: isPressed.value ? color : 'rgba(255,255,255,0.9)',
            borderColor: isPressed.value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
        };
    });

    return (
        <View
            style={styles.container}
            onLayout={(e) => {
                // Register absolute coordinates
                const { x, y, width, height } = e.nativeEvent.layout;
                // Wait, native view coordinates will map incorrectly if nested.
                // We'll use a local ref for bounding box later, but for now measure from layout.
                // The prompt specified we can use measure, or simplified layout
            }}
            ref={(ref) => {
                if (ref) {
                    let attempts = 0;
                    const interval = setInterval(() => {
                        ref.measure((x, y, width, height, pageX, pageY) => {
                            if (width > 0 && height > 0) {
                                registerZone('joystick', { x: pageX, y: pageY, width, height });
                                clearInterval(interval);
                            }
                        });
                        attempts++;
                        if (attempts > 20) clearInterval(interval);
                    }, 200);
                }
            }}
        >
            <View style={styles.promptWrapper} pointerEvents="none">
                <Text style={styles.promptText}>TAP TO STEER</Text>
            </View>

            <Animated.View style={[styles.base, { width: size, height: size, borderRadius: size / 2, position: 'absolute' }, baseStyle]} pointerEvents="none">
                {/* Crosshairs */}
                <View style={[styles.crosshair, { width: '100%', height: 2 }]} />
                <View style={[styles.crosshair, { height: '100%', width: 2 }]} />

                <Animated.View style={[styles.thumb, thumbStyle]} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    promptWrapper: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    promptText: {
        color: '#52525b',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    base: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 2,
        borderColor: 'rgba(63, 63, 70, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    crosshair: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    thumb: {
        width: 40,
        height: 40,
        borderRadius: 20,
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbText: {
        color: '#09090b',
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    debugPanel: {
        position: 'absolute',
        bottom: 16,
        flexDirection: 'row',
        gap: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    debugText: {
        color: '#71717a',
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
