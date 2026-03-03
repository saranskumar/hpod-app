import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WebSocketProvider } from './src/contexts/WebSocketContext';
import { ControlSurface } from './src/components/ControlSurface';
import { TopMenu } from './src/components/TopMenu';
import { LeftTopSliders } from './src/components/LeftTopSliders';
import { JoystickControl } from './src/components/JoystickControl';
import { CenterButtons } from './src/components/CenterButtons';
import { TerminalLog } from './src/components/TerminalLog';
import { RightBottomRotation } from './src/components/RightBottomRotation';
import { ClayPanel } from './src/components/ClayPanel';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';

function MainConsole({ isLocked, setIsLocked }: { isLocked: boolean, setIsLocked: (l: boolean) => void }) {

  useEffect(() => {
    // Lock screen orientation to landscape as soon as app opens
    async function lockScreen() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
    lockScreen();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'bottom', 'left']}>
      {/* Native status bar styling (will be hidden on most platforms per app.json, but kept for Fallback iOS) */}
      <StatusBar hidden={true} />

      <View style={styles.container}>
        <TopMenu />

        {/* Main 3-column Layout */}
        <View style={styles.mainGrid}>

          {/* Left Column */}
          <View style={styles.column}>
            <ClayPanel style={{ flex: 1 }}>
              <LeftTopSliders isLocked={isLocked} setIsLocked={setIsLocked} />
            </ClayPanel>
            <ClayPanel style={{ flex: 1 }}>
              {/* Joystick remains active even when sliders locked */}
              <JoystickControl size={160} />
            </ClayPanel>
          </View>

          {/* Center Column */}
          <ClayPanel style={styles.centerColumn}>
            <CenterButtons isLocked={isLocked} setIsLocked={setIsLocked} />
          </ClayPanel>

          {/* Right Column */}
          <View style={styles.column}>
            <ClayPanel style={{ flex: 1 }}>
              <TerminalLog />
            </ClayPanel>
            <ClayPanel style={{ flex: 0.6 }}>
              <RightBottomRotation />
            </ClayPanel>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [isLocked, setIsLocked] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedLock = await AsyncStorage.getItem('@hexapod_is_locked');
        if (savedLock !== null) {
          setIsLocked(savedLock === 'true');
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setIsReady(true);
      }
    };
    loadSettings();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (isReady) {
      AsyncStorage.setItem('@hexapod_is_locked', isLocked ? 'true' : 'false').catch(e => console.error("Failed to save settings", e));
    }
  }, [isLocked, isReady]);

  // Don't render until settings jump in to prevent flicker
  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaProvider>
        <WebSocketProvider>
          <ControlSurface isLocked={isLocked}>
            <MainConsole isLocked={isLocked} setIsLocked={setIsLocked} />
          </ControlSurface>
        </WebSocketProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b', // zinc-950
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainGrid: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  centerColumn: {
    width: 80,
    zIndex: 50,
  }
});
