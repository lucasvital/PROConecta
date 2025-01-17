import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, Card, Button, IconButton, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ServiceService } from '../../services/service';
import auth from '@react-native-firebase/auth';

interface Demand {
  id: string;
  title: string;
  serviceType: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  preferredDate?: Date;
  photos: { uri: string }[];
  clientId: string;
  status: 'open' | 'in_progress' | 'completed';
  createdAt: Date;
}

export const AvailableDemandsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDemands = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      // TODO: Implementar filtro por localização e tipo de serviço
      const availableDemands = await ServiceService.getAvailableDemandsList();
      setDemands(availableDemands);
    } catch (error) {
      console.error('Error loading demands:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDemands();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDemands();
  };

  const handleAcceptDemand = async (demandId: string) => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      await ServiceService.acceptDemand(demandId, currentUser.uid);
      // TODO: Navegar para a tela de detalhes da demanda
      loadDemands();
    } catch (error) {
      console.error('Error accepting demand:', error);
      alert('Erro ao aceitar demanda. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineSmall">Demandas Disponíveis</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {loading ? (
          <Text style={styles.message}>Carregando demandas...</Text>
        ) : demands.length === 0 ? (
          <Text style={styles.message}>Nenhuma demanda disponível no momento.</Text>
        ) : (
          demands.map((demand) => (
            <Card key={demand.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <Text variant="titleMedium">{demand.title}</Text>
                    <Text variant="bodyMedium" style={styles.serviceType}>
                      {demand.serviceType}
                    </Text>
                  </View>
                  {demand.photos.length > 0 && (
                    <Avatar.Image
                      size={48}
                      source={{ uri: demand.photos[0].uri }}
                    />
                  )}
                </View>

                <Text variant="bodyMedium" style={styles.description}>
                  {demand.description}
                </Text>

                <View style={styles.detailsContainer}>
                  <View style={styles.detail}>
                    <IconButton
                      icon="map-marker"
                      size={20}
                      style={styles.detailIcon}
                    />
                    <Text variant="bodyMedium">{demand.location.address}</Text>
                  </View>

                  {demand.preferredDate && (
                    <View style={styles.detail}>
                      <IconButton
                        icon="calendar"
                        size={20}
                        style={styles.detailIcon}
                      />
                      <Text variant="bodyMedium">
                        {new Date(demand.preferredDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </Card.Content>

              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => handleAcceptDemand(demand.id)}
                >
                  Aceitar Demanda
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    // TODO: Navegar para tela de detalhes
                  }}
                >
                  Ver Detalhes
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  message: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  serviceType: {
    opacity: 0.7,
    marginTop: 4,
  },
  description: {
    marginBottom: 16,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    margin: 0,
    marginRight: 4,
  },
});
