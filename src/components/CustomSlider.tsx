import React, { useState } from 'react';
import { View, StyleSheet, Text, DimensionValue } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { ControlIdx } from '../contexts/WebSocketContext';
import { useControlSurface } from './ControlSurface';

interface Props {
    controlIdx: ControlIdx;
    label?: string;
    width?: DimensionValue;
    height?: DimensionValue;
    color?: string;
    autoCenter?: boolean;
    vertical?: boolean;
    min?: number;
    max?: number;
    thumbScale?: number;
}

export function CustomSlider({
    controlIdx,
    label,
    width = 200,
    height = 40,
    color = 'rgba(239, 68, 68, 0.8)',
    autoCenter = false,
    vertical = false,
    min = -1,
    max = 1,
    thumbScale = 1,
}: Props) {
    const { registerZone, sliderStates } = useControlSurface();
    const id = (controlIdx === ControlIdx.Z) ? 'Z' :
        // Note: 'Y' is ControlIdx.Y, 'SPEED' is ControlIdx.SPEED
        (controlIdx === ControlIdx.Y) ? 'Y' :
            (controlIdx === ControlIdx.SPEED) ? 'SPEED' :
                (controlIdx === ControlIdx.YAW_ROTATION) ? 'YAW_ROTATION' : 'Z';

    const state = sliderStates[id] || sliderStates['Z']; // fallback
    const { value, isPressed } = state;

    // value goes from -1 to 1.
    // We map it to pixel translation for the thumb and active track

    const [trackLength, setTrackLength] = useState(0);

    const thumbSize = 30 * thumbScale;
    const maxTravel = Math.max(0, (trackLength - thumbSize) / 2);

    // Derived values for styling
    const getPixelTranslate = (v: number) => {
        'worklet';
        // v is in [-1, 1].
        // For vertical, -1 is bottom, 1 is top. 
        // In react native coordinates, negative translate is UP.
        if (vertical) {
            return -v * maxTravel; // So if v=1 (top), translate is -maxTravel (move UP)
        } else {
            return v * maxTravel; // If v=1 (right), translate is +maxTravel (move RIGHT)
        }
    };

    const thumbStyle = useAnimatedStyle(() => {
        const translatePx = getPixelTranslate(value.value);
        return {
            transform: [
                { translateX: vertical ? 0 : translatePx },
                { translateY: vertical ? translatePx : 0 },
                { scale: withSpring(isPressed.value ? 0.95 : 1) },
            ],
            backgroundColor: isPressed.value ? color : 'rgba(255,255,255,0.9)',
            borderColor: isPressed.value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
        };
    });

    const activeTrackStyle = useAnimatedStyle(() => {
        const translatePx = getPixelTranslate(value.value);
        if (vertical) {
            return {
                height: Math.abs(translatePx),
                bottom: translatePx < 0 ? '50%' : undefined,
                top: translatePx > 0 ? '50%' : undefined,
                backgroundColor: color,
            };
        } else {
            return {
                width: Math.abs(translatePx),
                right: translatePx < 0 ? '50%' : undefined,
                left: translatePx > 0 ? '50%' : undefined,
                backgroundColor: color,
            };
        }
    });

    const NumberDisplay = () => {
        // Since reanimated doesn't easily let us render a float directly outside,
        // we can just use an animated component or rely on state update. But the prompt removes state display.
        // We'll leave the circle empty or use Reanimated Text if necessary, but fixed UI is fine.
        return null;
    };

    return (
        <View
            style={[styles.container, { width, height, flexDirection: vertical ? 'column' : 'row' }]}
            onLayout={(e) => {
                const { width: w, height: h } = e.nativeEvent.layout;
                setTrackLength(vertical ? h : w);
            }}
            ref={(ref) => {
                if (ref) {
                    let attempts = 0;
                    const interval = setInterval(() => {
                        ref.measure((x, y, width, height, pageX, pageY) => {
                            if (width > 0 && height > 0) {
                                registerZone(id, { x: pageX, y: pageY, width, height });
                                clearInterval(interval);
                            }
                        });
                        attempts++;
                        if (attempts > 20) clearInterval(interval);
                    }, 200);
                }
            }}
            pointerEvents="none"
        >
            {label && (
                <Text style={[styles.label, vertical ? { transform: [{ rotate: '-90deg' }], left: -20 } : { top: -20 }]}>
                    {label}
                </Text>
            )}

            {/* Track */}
            <View style={[styles.track, { width: vertical ? 6 : '100%', height: vertical ? '100%' : 6 }]}>
                <Animated.View style={[styles.activeTrack, activeTrackStyle]} />
            </View>

            {/* Thumb */}
            <Animated.View style={[styles.thumb, { width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2 }, thumbStyle]}>
                {/* Visual only */}
            </Animated.View>

            {/* Center tick */}
            <View style={[
                styles.tick,
                vertical ? { width: 12, height: 2 } : { width: 2, height: 12 }
            ]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    label: {
        position: 'absolute',
        color: '#71717a',
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    track: {
        position: 'absolute',
        backgroundColor: 'rgba(39, 39, 42, 0.6)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    activeTrack: {
        position: 'absolute',
    },
    tick: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    thumb: {
        position: 'absolute',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbText: {
        fontWeight: 'bold',
        fontFamily: 'monospace',
    }
});
