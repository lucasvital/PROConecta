import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const HomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [userType, setUserType] = useState<'client' | 'provider' | null>(null);

  useEffect(() => {
    const loadUserType = async () => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        const userDoc = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .get();
        
        setUserType(userDoc.data()?.userType || null);
      }
    };

    loadUserType();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Bem-vindo ao PRO Connect
        </Text>

        {userType === 'client' ? (
          <View style={styles.clientContent}>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Precisa de um serviço?</Text>
                <Text variant="bodyMedium" style={styles.cardText}>
                  Crie uma nova demanda e encontre o profissional ideal para seu serviço.
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="contained"
                  onPress={() => navigation.navigate('CreateDemand')}
                >
                  Criar Nova Demanda
                </Button>
              </Card.Actions>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Suas Demandas</Text>
                <Text variant="bodyMedium" style={styles.cardText}>
                  Veja o histórico e status dos seus serviços.
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="outlined"
                  onPress={() => navigation.navigate('ServiceHistory', { userType: 'client' })}
                >
                  Ver Histórico
                </Button>
              </Card.Actions>
            </Card>
          </View>
        ) : userType === 'provider' ? (
          <View style={styles.providerContent}>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Demandas Disponíveis</Text>
                <Text variant="bodyMedium" style={styles.cardText}>
                  Encontre serviços próximos a você.
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="contained"
                  onPress={() => navigation.navigate('AvailableDemands')}
                >
                  Ver Demandas
                </Button>
              </Card.Actions>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Seus Serviços</Text>
                <Text variant="bodyMedium" style={styles.cardText}>
                  Gerencie seus serviços ativos e histórico.
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="outlined"
                  onPress={() => navigation.navigate('ServiceHistory', { userType: 'provider' })}
                >
                  Ver Serviços
                </Button>
              </Card.Actions>
            </Card>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  clientContent: {
    flex: 1,
  },
  providerContent: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
  },
  cardText: {
    marginTop: 8,
    opacity: 0.7,
  },
});
