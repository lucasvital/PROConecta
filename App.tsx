import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme, StatusBar } from 'react-native';
import { lightTheme, darkTheme } from './src/theme/theme';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { ClientTutorialScreen } from './src/screens/onboarding/ClientTutorialScreen';
import { ProviderFormScreen } from './src/screens/onboarding/ProviderFormScreen';
import { ProviderTutorialScreen } from './src/screens/onboarding/ProviderTutorialScreen';
import { ProfilePhotoScreen } from './src/screens/onboarding/ProfilePhotoScreen';
import { MainNavigator } from './src/navigation/MainNavigator';
import { ReviewsScreen } from './src/screens/common/ReviewsScreen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor="transparent"
        translucent={true}
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <PaperProvider theme={theme}>
        <NavigationContainer onReady={onLayoutRootView}>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ClientTutorial" component={ClientTutorialScreen} />
            <Stack.Screen name="ProviderForm" component={ProviderFormScreen} />
            <Stack.Screen name="ProviderTutorial" component={ProviderTutorialScreen} />
            <Stack.Screen name="ProfilePhoto" component={ProfilePhotoScreen} />
            <Stack.Screen name="MainApp" component={MainNavigator} />
            <Stack.Screen 
              name="Reviews" 
              component={ReviewsScreen}
              options={{
                headerShown: false
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
