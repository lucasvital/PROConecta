import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ServiceHistoryScreen } from '../screens/client/ServiceHistoryScreen';
import { ReviewsScreen } from '../screens/common/ReviewsScreen';
import { CreateDemandScreen } from '../screens/client/CreateDemandScreen';
import { AvailableDemandsScreen } from '../screens/provider/AvailableDemandsScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="CreateDemand" component={CreateDemandScreen} />
      <Stack.Screen name="AvailableDemands" component={AvailableDemandsScreen} />
    </Stack.Navigator>
  );
};
