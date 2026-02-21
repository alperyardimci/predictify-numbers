import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameProvider } from './src/context/GameContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { RecordsScreen } from './src/screens/RecordsScreen';
import { OnlineLobbyScreen } from './src/screens/OnlineLobbyScreen';
import { OnlineGameScreen } from './src/screens/OnlineGameScreen';
import { LeagueScreen } from './src/screens/LeagueScreen';
import { LeagueDetailScreen } from './src/screens/LeagueDetailScreen';
import { ChallengeListener } from './src/components/ChallengeListener';
import { RootStackParamList } from './src/types';
import { colors } from './src/constants/theme';
import { ensureAuth } from './src/services/playerIdentity';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    ensureAuth()
      .then(() => setAuthReady(true))
      .catch((err) => {
        console.error('[Auth] Failed:', err);
        setAuthError(err?.message || 'Authentication failed');
      });
  }, []);

  if (authError) {
    return (
      <View style={loadingStyles.container}>
        <Text style={{ color: '#ff6b6b', fontSize: 16, textAlign: 'center', paddingHorizontal: 32 }}>
          Bağlantı hatası:{'\n'}{authError}
        </Text>
      </View>
    );
  }

  if (!authReady) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <GameProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Records" component={RecordsScreen} />
          <Stack.Screen name="OnlineLobby" component={OnlineLobbyScreen} />
          <Stack.Screen name="OnlineGame" component={OnlineGameScreen} />
          <Stack.Screen name="League" component={LeagueScreen} />
          <Stack.Screen name="LeagueDetail" component={LeagueDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <ChallengeListener navigationRef={navigationRef} />
    </GameProvider>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
