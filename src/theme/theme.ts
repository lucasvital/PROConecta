import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'Inter_400Regular',
  headlineSmall: {
    fontFamily: 'Inter_600SemiBold',
  },
  headlineMedium: {
    fontFamily: 'Inter_600SemiBold',
  },
  headlineLarge: {
    fontFamily: 'Inter_600SemiBold',
  },
  titleMedium: {
    fontFamily: 'Inter_500Medium',
  },
  titleSmall: {
    fontFamily: 'Inter_500Medium',
  },
  labelMedium: {
    fontFamily: 'Inter_500Medium',
  },
  labelSmall: {
    fontFamily: 'Inter_500Medium',
  },
};

const baseColors = {
  primary: '#FFD700',
  secondary: '#FFC107',
};

const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({config: fontConfig}),
  colors: {
    ...MD3LightTheme.colors,
    ...baseColors,
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    onSurface: '#000000',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({config: fontConfig}),
  colors: {
    ...MD3DarkTheme.colors,
    ...baseColors,
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    onSurface: '#FFFFFF',
    backdrop: 'rgba(0, 0, 0, 0.8)',
  },
};

export { lightTheme, darkTheme };
