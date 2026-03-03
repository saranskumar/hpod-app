import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export enum ControlIdx {
    AX = 0,
    AY = 1,
    Z = 2,
    Y = 3,
    SPEED = 4,
    LED_COLOR = 5,
    LED_PATTERN = 6,
    M1 = 7,  // Legacy mapping slot, now ACTIVE_MODE
    M2 = 8,  // Legacy
    M3 = 9,  // Legacy
    M4 = 10, // Legacy
    M5 = 11, // Legacy
    YAW_ROTATION = 12,
    POWER_BTN = 13, // Legacy
    ACTIVE_MODE = 14, // 0 = none, 1 = M1, 2 = M2, etc.
}

export enum ConnectionState {
    CONNECTING = 'CONNECTING',
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    ERROR = 'ERROR'
}

type LogType = 'info' | 'warn' | 'error' | 'recv';
export interface LogMsg {
    id: number;
    time: string;
    type: LogType;
    msg: string;
}

interface WebSocketContextType {
    wsUrl: string;
    setWsUrl: (url: string) => void;
    connectionState: ConnectionState;
    updateControlState: (index: ControlIdx, value: number) => void;
    getControlSnapshot: () => Float32Array;
    logs: LogMsg[];
    clearLogs: () => void;
    toggleConnection: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const [wsUrl, setWsUrlState] = useState('ws://hexapod.local:81/');
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CLOSED);
    const [isUserDisconnected, setIsUserDisconnected] = useState<boolean>(false);
    const [logs, setLogs] = useState<LogMsg[]>([]);

    // 16 floats (64 bytes)
    const controlStateRef = useRef<Float32Array>(new Float32Array(16));
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const logId = useRef(0);

    const toggleConnection = useCallback(() => {
        setIsUserDisconnected(prev => {
            const willDisconnect = !prev;
            if (willDisconnect) {
                // User wants to disconnect
                if (wsRef.current) {
                    wsRef.current.close();
                    wsRef.current = null;
                }
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                setConnectionState(ConnectionState.CLOSED);
            }
            return willDisconnect; // Return new state
        });
    }, []);

    const addLog = useCallback((type: LogType, msg: string) => {
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => {
            const next = [...prev, { id: logId.current++, time, type, msg }];
            if (next.length > 50) next.shift(); // Keep last 50, remove oldest from the start
            return next;
        });
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    const setWsUrl = useCallback(async (url: string) => {
        setWsUrlState(url);
        try {
            await AsyncStorage.setItem('@hexapod_ws_url', url);
        } catch (e) {
            console.error('Failed to save WS URL', e);
        }
    }, []);

    // Load saved settings on boot
    useEffect(() => {
        const loadSaved = async () => {
            try {
                const savedUrl = await AsyncStorage.getItem('@hexapod_ws_url');
                if (savedUrl) setWsUrlState(savedUrl);
            } catch (e) { }
        };
        loadSaved();
    }, []);

    // WebSocket Management & Reconnection Loop
    useEffect(() => {

        let isMounted = true;
        const connect = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) return;

            setConnectionState(ConnectionState.CONNECTING);
            addLog('info', `Connecting to ${wsUrl}...`);

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!isMounted) return;
                setConnectionState(ConnectionState.OPEN);
                addLog('info', `Connected to ${wsUrl}`);
            };

            ws.onclose = (e) => {
                if (!isMounted) return;
                setConnectionState(ConnectionState.CLOSED);
                addLog('warn', `Disconnected (Code: ${e.code})`);
                scheduleReconnect();
            };

            ws.onerror = (e) => {
                if (!isMounted) return;
                setConnectionState(ConnectionState.ERROR);
            };

            ws.onmessage = (e) => {
                if (!isMounted) return;
                if (typeof e.data === 'string') {
                    if (e.data.startsWith('LOG|')) {
                        addLog('recv', e.data.substring(4));
                    } else {
                        addLog('recv', e.data);
                    }
                }
            };
        };

        const scheduleReconnect = () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(() => {
                if (isMounted && !isUserDisconnected && wsRef.current?.readyState !== WebSocket.OPEN) {
                    addLog('info', `Retrying connection...`);
                    connect();
                }
            }, 3000);
        };

        if (!isUserDisconnected) {
            connect();
        }

        return () => {
            isMounted = false;
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [wsUrl, addLog, isUserDisconnected]);

    // ** 50Hz CONTINUOUS TRANSMISSION LOOP **
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                try {
                    const byteBuffer = new Uint8Array(controlStateRef.current.buffer);
                    wsRef.current.send(byteBuffer);
                } catch (e) { }
            }
        }, 20); // 20ms = 50Hz

        return () => clearInterval(intervalId);
    }, []);

    const updateControlState = useCallback((index: ControlIdx, value: number) => {
        controlStateRef.current[index] = value;
    }, []);

    const getControlSnapshot = useCallback(() => {
        return new Float32Array(controlStateRef.current); // safe copy
    }, []);

    return (
        <WebSocketContext.Provider value={{
            wsUrl, setWsUrl, connectionState,
            updateControlState, getControlSnapshot, logs, clearLogs, toggleConnection
        }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useHexapodWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useHexapodWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
