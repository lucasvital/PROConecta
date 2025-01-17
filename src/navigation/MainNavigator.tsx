import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HomeScreen } from '../screens/main/HomeScreen';
import { SearchScreen } from '../screens/main/SearchScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { CreateDemandScreen } from '../screens/client/CreateDemandScreen';
import { AvailableDemandsScreen } from '../screens/provider/AvailableDemandsScreen';
import { ServiceHistoryScreen } from '../screens/client/ServiceHistoryScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { StatusBar } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ color, size }) => (
            <Icon name="magnify" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator = () => {
  const theme = useTheme();
  
  return (
    <>
      <StatusBar
        backgroundColor="transparent"
        translucent={true}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTransparent: true,
          headerTitleStyle: {
            color: theme.colors.onBackground,
          },
          headerTintColor: theme.colors.onBackground,
          contentStyle: {
            backgroundColor: theme.colors.background,
            paddingTop: 56,
          },
        }}
      >
        <Stack.Screen
          name="TabNavigator"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateDemand"
          component={CreateDemandScreen}
          options={{ title: 'Nova Demanda' }}
        />
        <Stack.Screen
          name="AvailableDemands"
          component={AvailableDemandsScreen}
          options={{ title: 'Demandas Disponíveis' }}
        />
        <Stack.Screen
          name="ServiceHistory"
          component={ServiceHistoryScreen}
          options={{ title: 'Histórico de Serviços' }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: 'Chat' }}
        />
      </Stack.Navigator>
    </>
  );
};
