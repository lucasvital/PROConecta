import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const tutorialSteps = [
  {
    title: 'Bem-vindo ao PRO Conecta!',
    description: 'Encontre os melhores profissionais para seus serviços.',
    icon: '🏠'
  },
  {
    title: 'Crie Demandas',
    description: 'Descreva o serviço que você precisa e encontre profissionais qualificados.',
    icon: '📝'
  },
  {
    title: 'Chat Integrado',
    description: 'Converse diretamente com os profissionais e tire todas as suas dúvidas.',
    icon: '💬'
  },
  {
    title: 'Avaliações',
    description: 'Avalie os serviços e ajude outros usuários a encontrarem os melhores profissionais.',
    icon: '⭐'
  }
];

export const ClientTutorialScreen = ({ navigation }: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();

      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 200);
    } else {
      // Navegar para a tela de foto de perfil
      navigation.replace('ProfilePhoto');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text variant="displayLarge" style={styles.icon}>
          {tutorialSteps[currentStep].icon}
        </Text>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          {tutorialSteps[currentStep].title}
        </Text>
        <Text variant="bodyLarge" style={styles.description}>
          {tutorialSteps[currentStep].description}
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentStep 
                    ? theme.colors.primary 
                    : theme.colors.surfaceVariant
                }
              ]}
            />
          ))}
        </View>

        <Button
          mode="contained"
          onPress={nextStep}
          style={styles.button}
        >
          {currentStep === tutorialSteps.length - 1 ? 'Começar' : 'Próximo'}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  footer: {
    paddingBottom: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    marginTop: 20,
  },
});
