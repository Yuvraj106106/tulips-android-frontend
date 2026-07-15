import "./src/polyfill";
import React, { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './src/screens/SplashScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import DateOfBirthScreen from './src/screens/DateOfBirthScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';
import AvatarSelectScreen from './src/screens/AvatarSelectScreen';
import PortalTransitionScreen from './src/screens/PortalTransitionScreen';
import CinematicIntroScreen from './src/screens/CinematicIntroScreen';
import ChatScreen from './src/screens/ChatScreen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import FloatingAvatar from './src/components/FloatingAvatar';

export type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  DateOfBirth: undefined;
  Language: undefined;
  Permissions: undefined;
  AvatarSelect: { fromSettings?: boolean } | undefined;
  PortalTransition: undefined;
  CinematicIntro: undefined;
  Chat: { autoStartListening?: boolean; triggerId?: number } | undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const pendingDeepLinkUrl = useRef<string | null>(null);

  // Handles the tulips://start-listening deep link fired by TulipVoiceInteractionSession
  // when the user triggers Tulip as the system Digital Assistant (e.g. power-button hold).
  // Jumps straight to Chat with mic listening already started — no wake-word needed since
  // the user already manually triggered the assistant.
  //
  // NOTE: if the app is cold-launched via this deep link, it jumps straight past
  // Splash/SignUp/onboarding into Chat. Fine for an already-onboarded user (the expected
  // case, since this trigger only matters once someone has set Tulip as their assistant),
  // but not yet tested against a fresh/never-onboarded install.
  const handleDeepLink = (url: string | null) => {
    if (!url || !url.includes('start-listening')) return;
    if (navigationRef.current?.isReady()) {
      navigationRef.current.navigate('Chat', { autoStartListening: true, triggerId: Date.now() });
    } else {
      // NavigationContainer not mounted yet (cold start race) — replay once ready.
      pendingDeepLinkUrl.current = url;
    }
  };

  useEffect(() => {
    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          if (pendingDeepLinkUrl.current) {
            handleDeepLink(pendingDeepLinkUrl.current);
            pendingDeepLinkUrl.current = null;
          }
        }}
      >
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="DateOfBirth" component={DateOfBirthScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="Permissions" component={PermissionsScreen} />
          <Stack.Screen name="AvatarSelect" component={AvatarSelectScreen} />
          <Stack.Screen name="PortalTransition" component={PortalTransitionScreen} />
          <Stack.Screen name="CinematicIntro" component={CinematicIntroScreen} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: true,
              title: 'Krishna AI',
              headerStyle: {
                backgroundColor: '#FFBF00',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <FloatingAvatar />
    </View>
  );
}
