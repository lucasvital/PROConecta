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

export const lightTheme = {
  ...MD3LightTheme,
  dark: false,
  fonts: configureFonts({config: fontConfig}),
  colors: {
    ...MD3LightTheme.colors,
    ...baseColors,
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    onBackground: '#000000',
    onSurface: '#000000',
    onSurfaceVariant: '#666666',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  fonts: configureFonts({config: fontConfig}),
  colors: {
    ...MD3DarkTheme.colors,
    ...baseColors,
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#AAAAAA',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
};
