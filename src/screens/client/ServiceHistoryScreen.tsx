import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, Card, Chip, IconButton, Divider, Button, TextInput, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserService } from '../../services/user';
import { ServiceService, ServiceRequest } from '../../services/service';
import firestore from '@react-native-firebase/firestore';

export const ServiceHistoryScreen = ({ route, navigation }: any) => {
  const theme = useTheme();
  const [userType, setUserType] = useState<'client' | 'provider'>(route.params?.userType || 'client');
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Estilos que dependem do tema
  const dynamicStyles = {
    date: {
      marginTop: 4,
      color: theme.colors.onSurfaceVariant,
    },
    modal: {
      backgroundColor: theme.colors.background,
      padding: 20,
      margin: 20,
      borderRadius: 8,
    },
  };

  // Carregar o tipo de usuário do Firestore se não for fornecido nos parâmetros
  useEffect(() => {
    const loadUserType = async () => {
      if (!route.params?.userType) {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const userDoc = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .get();
          
          setUserType(userDoc.data()?.userType || 'client');
        }
      }
    };

    loadUserType();
  }, [route.params?.userType]);

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [userType]);

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const handleStatusUpdate = async (service: ServiceRequest, newStatus: ServiceRequest['status']) => {
    try {
      await ServiceService.updateServiceStatus(service.id, newStatus);
      
      // Se o serviço foi concluído, mostrar modal de avaliação
      if (newStatus === 'completed') {
        setSelectedService(service);
        setRatingModalVisible(true);
      }
      
      loadServices(); // Recarregar a lista
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('Erro ao atualizar status do serviço');
    }
  };

  const handleRating = async () => {
    if (!selectedService || rating === 0) {
      alert('Por favor, selecione uma avaliação');
      return;
    }

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      if (userType === 'client') {
        await UserService.updateProviderRating(
          selectedService.providerId!,
          currentUser.uid,
          {
            rating,
            comment,
            serviceId: selectedService.id,
          }
        );
      } else {
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

      setRatingModalVisible(false);
      setRating(0);
      setComment('');
      loadServices();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Erro ao enviar avaliação');
    }
  };

  const renderServiceCard = (service: ServiceRequest) => {
    const statusColors = {
      pending: theme.colors.primary,
      negotiating: theme.colors.secondary,
      accepted: '#4CAF50',
      in_progress: '#2196F3',
      completed: '#9C27B0',
      cancelled: '#F44336',
    };

    const statusLabels = {
      pending: 'Pendente',
      negotiating: 'Em Negociação',
      accepted: 'Aceito',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };

    const isProvider = userType === 'provider';
    const showChat = service.status !== 'pending' && service.status !== 'cancelled' && service.status !== 'completed';
    const canAccept = service.status === 'pending' && isProvider;
    const canProgress = service.status === 'accepted' && isProvider;
    const canComplete = service.status === 'in_progress' && isProvider;
    const canRate = service.status === 'completed';

    const handleAccept = async () => {
      try {
        await ServiceService.updateServiceStatus(service.id!, 'accepted');
        // Navegar para o chat após aceitar
        navigation.navigate('Chat', { serviceId: service.id });
      } catch (error) {
        console.error('Error accepting service:', error);
      }
    };

    const handleProgress = async () => {
      try {
        await ServiceService.updateServiceStatus(service.id!, 'in_progress');
      } catch (error) {
        console.error('Error updating service status:', error);
      }
    };

    const handleComplete = async () => {
      try {
        await ServiceService.updateServiceStatus(service.id!, 'completed');
      } catch (error) {
        console.error('Error completing service:', error);
      }
    };

    return (
      <Card key={service.id} style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View>
              <Text variant="titleMedium">{service.title}</Text>
              <Text variant="bodySmall" style={dynamicStyles.date}>
                {service.createdAt.toLocaleDateString()}
              </Text>
            </View>
            <Chip
              mode="flat"
              textStyle={{ color: '#FFFFFF' }}
              style={[styles.statusChip, { backgroundColor: statusColors[service.status] }]}
            >
              {statusLabels[service.status]}
            </Chip>
          </View>

          <Text variant="bodyMedium" style={{ marginTop: 8 }}>
            {service.description}
          </Text>

          <View style={styles.locationContainer}>
            <Icon name="map-marker" size={20} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.locationText}>
              {service.location.address}
            </Text>
          </View>

          {service.value > 0 && (
            <Text variant="titleMedium" style={{ marginTop: 8 }}>
              Valor: R$ {service.value.toFixed(2)}
            </Text>
          )}

          <View style={styles.actionButtons}>
            {showChat && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Chat', { serviceId: service.id })}
                icon="chat"
                style={styles.actionButton}
              >
                Chat
              </Button>
            )}

            {canAccept && (
              <Button
                mode="contained"
                onPress={handleAccept}
                icon="check"
                style={styles.actionButton}
              >
                Aceitar
              </Button>
            )}

            {canProgress && (
              <Button
                mode="contained"
                onPress={handleProgress}
                icon="play"
                style={styles.actionButton}
              >
                Iniciar
              </Button>
            )}

            {canComplete && (
              <Button
                mode="contained"
                onPress={handleComplete}
                icon="flag-checkered"
                style={styles.actionButton}
              >
                Concluir
              </Button>
            )}

            {service.status !== 'completed' && service.status !== 'cancelled' && (
              <Button
                mode="outlined"
                onPress={() => handleStatusUpdate(service.id!, 'cancelled')}
                icon="close"
                style={styles.actionButton}
              >
                Cancelar
              </Button>
            )}

            {canRate && !service.providerRating && userType === 'client' && (
              <Button
                mode="contained"
                onPress={() => {
                  setSelectedService(service);
                  setRatingModalVisible(true);
                }}
                icon="star"
                style={styles.actionButton}
              >
                Avaliar Prestador
              </Button>
            )}

            {canRate && !service.clientRating && userType === 'provider' && (
              <Button
                mode="contained"
                onPress={() => {
                  setSelectedService(service);
                  setRatingModalVisible(true);
                }}
                icon="star"
                style={styles.actionButton}
              >
                Avaliar Cliente
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.content}
      >
        {loading ? (
          <Text>Carregando...</Text>
        ) : services.length > 0 ? (
          services.map(service => renderServiceCard(service))
        ) : (
          <Text style={styles.emptyText}>
            Nenhum serviço encontrado
          </Text>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={ratingModalVisible}
          onDismiss={() => {
            setRatingModalVisible(false);
            setRating(0);
            setComment('');
          }}
          contentContainerStyle={dynamicStyles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Avaliar {userType === 'client' ? 'Prestador' : 'Cliente'}
          </Text>

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <IconButton
                key={star}
                icon={star <= rating ? 'star' : 'star-outline'}
                size={32}
                onPress={() => setRating(star)}
                iconColor={star <= rating ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            ))}
          </View>

          <TextInput
            label="Comentário (opcional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            style={styles.commentInput}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => {
                setRatingModalVisible(false);
                setRating(0);
                setComment('');
              }}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleRating}
              style={styles.modalButton}
            >
              Enviar
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusChip: {
    height: 24,
  },
  divider: {
    marginVertical: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    marginLeft: 4,
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  actionButton: {
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  commentInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 8,
  },
});
