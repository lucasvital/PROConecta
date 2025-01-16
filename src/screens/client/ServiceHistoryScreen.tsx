import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, Card, Chip, IconButton, Divider, Button, TextInput, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserService } from '../../services/user';
import { ServiceService, ServiceRequest } from '../../services/service';

export const ServiceHistoryScreen = ({ route, navigation }: any) => {
  const { userType } = route.params;
  const theme = useTheme();
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const loadServices = async () => {
    try {
      setLoading(true);
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      const userServices = await ServiceService.getUserServices(currentUser.uid, userType);
      setServices(userServices);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async () => {
    if (!selectedService || !rating) return;

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      if (userType === 'client') {
        // Cliente avaliando prestador
        await UserService.updateProviderRating(
          selectedService.providerId,
          currentUser.uid,
          {
            rating,
            comment,
            serviceId: selectedService.id,
          }
        );
      } else {
        // Prestador avaliando cliente
        await UserService.updateClientRating(
          selectedService.clientId,
          currentUser.uid,
          {
            rating,
            comment,
            serviceId: selectedService.id,
          }
        );
      }

      // Atualiza a lista local
      await loadServices();

      // Limpa o estado
      setRatingModalVisible(false);
      setSelectedService(null);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error rating service:', error);
    }
  };

  const canRateService = (service: ServiceRequest) => {
    if (service.status !== 'completed') return false;

    if (userType === 'client') {
      return !service.clientRating;
    } else {
      return !service.providerRating;
    }
  };

  const getServiceRating = (service: ServiceRequest) => {
    if (userType === 'client') {
      return service.clientRating;
    } else {
      return service.providerRating;
    }
  };

  const renderServiceCard = (service: ServiceRequest) => (
    <Card key={service.id} style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View>
            <Text variant="titleMedium">{service.serviceType}</Text>
            <Text variant="bodySmall" style={styles.date}>
              {service.createdAt.toLocaleDateString()}
            </Text>
          </View>
          <Chip
            style={{ backgroundColor: getStatusColor(service.status) }}
            textStyle={{ color: theme.colors.surface }}
          >
            {getStatusText(service.status)}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.description}>
          {service.description}
        </Text>

        <Divider style={styles.divider} />

        <View style={styles.cardFooter}>
          <View>
            <Text variant="bodyMedium">
              {userType === 'client' ? service.providerName : service.clientName}
            </Text>
            {getServiceRating(service) && (
              <View style={styles.ratingContainer}>
                <Icon name="star" size={16} color={theme.colors.primary} />
                <Text>{getServiceRating(service)?.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {canRateService(service) && (
            <Button
              mode="contained"
              onPress={() => {
                setSelectedService(service);
                setRatingModalVisible(true);
              }}
            >
              Avaliar
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderRatingModal = () => {
    const modalContainerStyle = {
      backgroundColor: theme.colors.surface,
      padding: 20,
      margin: 20,
      borderRadius: 8,
    };

    return (
      <Portal>
        <Modal
          visible={ratingModalVisible}
          onDismiss={() => setRatingModalVisible(false)}
          contentContainerStyle={modalContainerStyle}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Avaliar {userType === 'client' ? 'Prestador' : 'Cliente'}
          </Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            {selectedService?.serviceType} - {userType === 'client' 
              ? selectedService?.providerName 
              : selectedService?.clientName}
          </Text>

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <IconButton
                key={star}
                icon="star"
                size={32}
                iconColor={star <= rating ? theme.colors.primary : theme.colors.surfaceVariant}
                onPress={() => setRating(star)}
              />
            ))}
          </View>

          <TextInput
            label="Comentário (opcional)"
            value={comment}
            onChangeText={setComment}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.commentInput}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setRatingModalVisible(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleRate}
              style={styles.modalButton}
              disabled={!rating}
            >
              Avaliar
            </Button>
          </View>
        </Modal>
      </Portal>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const getStatusText = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceito';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'accepted':
        return theme.colors.primary;
      case 'in_progress':
        return theme.colors.info;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.surfaceVariant;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineSmall">Histórico de Serviços</Text>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {services.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhum serviço encontrado
          </Text>
        ) : (
          services.map(renderServiceCard)
        )}
      </ScrollView>
      {renderRatingModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  scrollContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
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
  date: {
    marginTop: 4,
  },
  description: {
    marginVertical: 8,
  },
  divider: {
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  modalTitle: {
    marginBottom: 8,
  },
  modalSubtitle: {
    marginBottom: 16,
  },
  commentInput: {
    marginTop: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    minWidth: 100,
  },
});
