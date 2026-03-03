import React, { createContext, useContext, useState } from 'react';
import { View, LayoutRectangle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, runOnJS, SharedValue } from 'react-native-reanimated';
import { useHexapodWebSocket, ControlIdx } from '../contexts/WebSocketContext';

// Define the global touch router context
interface TouchZone {
    id: string;
    rect: LayoutRectangle | null;
}

interface ControlSurfaceContextType {
    registerZone: (id: string, rect: LayoutRectangle) => void;
    // Shared values for components to render
    joystickState: {
        x: SharedValue<number>;
        y: SharedValue<number>;
        originX: SharedValue<number>;
        originY: SharedValue<number>;
        isPressed: SharedValue<boolean>;
        maxRadius: SharedValue<number>;
    };
    sliderStates: Record<string, {
        value: SharedValue<number>;
        isPressed: SharedValue<boolean>;
    }>;
}

export const ControlSurfaceContext = createContext<ControlSurfaceContextType | null>(null);

export const useControlSurface = () => {
    const ctx = useContext(ControlSurfaceContext);
    if (!ctx) throw new Error("Must be inside ControlSurface");
    return ctx;
};

export function ControlSurface({ children, isLocked = false }: { children: React.ReactNode, isLocked?: boolean }) {
    const { updateControlState } = useHexapodWebSocket();
    const [zones, setZones] = useState<Record<string, LayoutRectangle>>({});

    const registerZone = (id: string, rect: LayoutRectangle) => {
        setZones(prev => ({ ...prev, [id]: rect }));
    };

    // --- SHARED STATE FOR RENDERERS ---
    const joystickState = {
        x: useSharedValue(0),
        y: useSharedValue(0),
        originX: useSharedValue(0),
        originY: useSharedValue(0),
        isPressed: useSharedValue(false),
        maxRadius: useSharedValue(55),
    };

    const sliderStates = {
        Z: { value: useSharedValue(0), isPressed: useSharedValue(false) },
        Y: { value: useSharedValue(0), isPressed: useSharedValue(false) },
        SPEED: { value: useSharedValue(0), isPressed: useSharedValue(false) },
        YAW_ROTATION: { value: useSharedValue(0), isPressed: useSharedValue(false) },
    };

    // --- WEBSOCKET REPORTER ---
    const reportJoystick = (gx: number, gy: number) => {
        updateControlState(ControlIdx.AX, gx);
        updateControlState(ControlIdx.AY, gy);
    };

    const reportSlider = (id: string, val: number) => {
        let idx = ControlIdx.Z;
        if (id === 'Y') idx = ControlIdx.Y;
        if (id === 'SPEED') idx = ControlIdx.SPEED;
        if (id === 'YAW_ROTATION') idx = ControlIdx.YAW_ROTATION;
        updateControlState(idx, val);
    };

    // --- POINTER ROUTING ---
    const joystickPointer = useSharedValue(-1);
    const sliderPointers = useSharedValue<Record<string, number>>({});

    const globalGesture = Gesture.Pan()
        .maxPointers(10)
        .onTouchesDown((e) => {
            const currentZones = zones; // Passed from JS closure
            for (const t of e.changedTouches) {
                // Find which zone this touch is in
                const PAD = 40; // Hit slop so you don't have to be pixel perfect
                for (const [id, rect] of Object.entries(currentZones)) {
                    if (
                        t.x >= (rect.x - PAD) && t.x <= (rect.x + rect.width + PAD) &&
                        t.y >= (rect.y - PAD) && t.y <= (rect.y + rect.height + PAD)
                    ) {
                        if (id === 'joystick' && joystickPointer.value === -1) {
                            joystickPointer.value = t.id;
                            joystickState.isPressed.value = true;
                            // Reset origin based on center of joystick
                            joystickState.x.value = 0;
                            joystickState.y.value = 0;
                            // Floating joystick origin
                            joystickState.originX.value = t.x - rect.x;
                            joystickState.originY.value = t.y - rect.y;
                        } else if (sliderStates[id as keyof typeof sliderStates] && !sliderPointers.value[id]) {
                            // Suppress locked sliders
                            if (isLocked && (id === 'Z' || id === 'Y' || id === 'SPEED')) {
                                continue;
                            }

                            const pointers = { ...sliderPointers.value };
                            pointers[id] = t.id;
                            sliderPointers.value = pointers;
                            sliderStates[id as keyof typeof sliderStates].isPressed.value = true;

                            // Instant jump to touch
                            const isVert = id === 'Z' || id === 'Y' || id === 'SPEED';
                            let val = 0;
                            if (isVert) {
                                const pos = t.y - rect.y;
                                val = 1 - (pos / (rect.height / 2));
                            } else {
                                const pos = t.x - rect.x;
                                val = (pos / (rect.width / 2)) - 1;
                            }
                            val = Math.max(-1, Math.min(1, val));
                            sliderStates[id as keyof typeof sliderStates].value.value = val;
                            runOnJS(reportSlider)(id, val);
                        }
                    }
                }
            }
        })
        .onTouchesMove((e) => {
            for (const t of e.changedTouches) {
                if (t.id === joystickPointer.value) {
                    const rect = zones['joystick'];
                    if (rect) {
                        const centerX = rect.x + joystickState.originX.value;
                        const centerY = rect.y + joystickState.originY.value;
                        const maxRadius = joystickState.maxRadius.value;

                        const dx = t.x - centerX;
                        const dy = t.y - centerY;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        let nx = dx;
                        let ny = dy;
                        if (distance > maxRadius) {
                            nx = (dx / distance) * maxRadius;
                            ny = (dy / distance) * maxRadius;
                        }

                        joystickState.x.value = nx;
                        joystickState.y.value = ny;

                        // Report to WS
                        runOnJS(reportJoystick)(nx / maxRadius, -(ny / maxRadius));
                    }
                }

                // Handle Sliders
                for (const [id, pointerId] of Object.entries(sliderPointers.value)) {
                    if (t.id === pointerId) {
                        const rect = zones[id];
                        if (rect) {
                            const isVert = id === 'Z' || id === 'Y' || id === 'SPEED';

                            // Map coordinate to -1 -> 1 logic
                            let val = 0;
                            if (isVert) {
                                // Y mapped inside rect.height
                                const pos = t.y - rect.y;
                                val = 1 - (pos / (rect.height / 2));
                                // Center is 0, top is 1, bottom is -1
                            } else {
                                // X mapped inside rect.width
                                const pos = t.x - rect.x;
                                val = (pos / (rect.width / 2)) - 1;
                                // Center is 0, right is 1, left is -1
                            }

                            // clamp
                            val = Math.max(-1, Math.min(1, val));

                            sliderStates[id as keyof typeof sliderStates].value.value = val;
                            runOnJS(reportSlider)(id, val);
                        }
                    }
                }
            }
        })
        .onTouchesUp((e) => {
            for (const t of e.changedTouches) {
                if (t.id === joystickPointer.value) {
                    joystickPointer.value = -1;
                    joystickState.isPressed.value = false;
                    joystickState.x.value = 0; // spring back locally, but we removed springs
                    joystickState.y.value = 0;
                    runOnJS(reportJoystick)(0, 0);
                }

                for (const [id, pointerId] of Object.entries(sliderPointers.value)) {
                    if (t.id === pointerId) {
                        const pointers = { ...sliderPointers.value };
                        delete pointers[id];
                        sliderPointers.value = pointers;
                        sliderStates[id as keyof typeof sliderStates].isPressed.value = false;

                        // Auto-center Yaw
                        if (id === 'YAW_ROTATION') {
                            sliderStates[id].value.value = 0;
                            runOnJS(reportSlider)(id, 0);
                        }
                    }
                }
            }
        });

    return (
        <ControlSurfaceContext.Provider value={{ registerZone, joystickState, sliderStates }}>
            <GestureDetector gesture={globalGesture}>
                <View style={{ flex: 1 }} pointerEvents="box-none">
                    {children}
                </View>
            </GestureDetector>
        </ControlSurfaceContext.Provider>
    );
}
