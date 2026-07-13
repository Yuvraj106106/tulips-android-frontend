import "./src/polyfill";
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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

export type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  DateOfBirth: undefined;
  Language: undefined;
  Permissions: undefined;
  AvatarSelect: { fromSettings?: boolean } | undefined;
  PortalTransition: undefined;
  CinematicIntro: undefined;
  Chat: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
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
  );
}
