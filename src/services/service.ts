import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Message {
  id?: string;
  serviceId: string;
  senderId: string;
  content: string;
  timestamp: any;
  type: 'text' | 'proposal';
  proposalValue?: number;
}

export interface ServiceRequest {
  id?: string;
  title: string;
  description: string;
  serviceType: string;
  location: Location;
  photos?: string[];
  clientId: string;
  providerId?: string;
  status: 'pending' | 'negotiating' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  value: number;
  proposedValue?: number;
  createdAt: any;
  updatedAt?: any;
  completedAt?: any;
  clientRating?: number;
  providerRating?: number;
  clientComment?: string;
  providerComment?: string;
}

export const ServiceService = {
  // Buscar serviços do usuário
  getUserServices: async (userId: string, userType: 'client' | 'provider') => {
    try {
      const field = userType === 'provider' ? 'providerId' : 'clientId';
      
      const servicesSnapshot = await firestore()
        .collection('services')
        .where(field, '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
        clientRatedAt: doc.data().clientRatedAt?.toDate(),
        providerRatedAt: doc.data().providerRatedAt?.toDate(),
        preferredDate: doc.data().preferredDate?.toDate(),
      })) as ServiceRequest[];
    } catch (error) {
      console.error('Error getting user services:', error);
      throw error;
    }
  },

  // Atualizar status do serviço
  updateServiceStatus: async (serviceId: string, status: ServiceRequest['status']) => {
    try {
      const serviceRef = firestore().collection('services').doc(serviceId);
      const serviceDoc = await serviceRef.get();
      
      if (!serviceDoc.exists) {
        throw new Error('Serviço não encontrado');
      }

      const serviceData = serviceDoc.data() as ServiceRequest;
      const timestamp = firestore.FieldValue.serverTimestamp();

      // Buscar nomes dos usuários para as notificações
      const [clientDoc, providerDoc] = await Promise.all([
        firestore().collection('users').doc(serviceData.clientId).get(),
        serviceData.providerId ? firestore().collection('users').doc(serviceData.providerId).get() : null,
      ]);

      const clientName = clientDoc.data()?.name || 'Cliente';
      const providerName = providerDoc?.data()?.name || 'Prestador';

      // Criar notificação baseada no novo status
      let notificationTitle = '';
      let notificationBody = '';
      let notificationTo = '';

      switch (status) {
        case 'accepted':
          notificationTitle = 'Serviço Aceito!';
          notificationBody = `${providerName} aceitou seu serviço "${serviceData.title}"`;
          notificationTo = serviceData.clientId;
          break;
        case 'in_progress':
          notificationTitle = 'Serviço Iniciado';
          notificationBody = `O serviço "${serviceData.title}" foi iniciado`;
          notificationTo = serviceData.clientId;
          break;
        case 'completed':
          notificationTitle = 'Serviço Concluído';
          notificationBody = `O serviço "${serviceData.title}" foi concluído. Por favor, avalie o prestador.`;
          notificationTo = serviceData.clientId;
          break;
        case 'cancelled':
          if (serviceData.providerId) {
            notificationTitle = 'Serviço Cancelado';
            notificationBody = `${providerName} cancelou o serviço "${serviceData.title}"`;
            notificationTo = serviceData.clientId;
          } else {
            notificationTitle = 'Serviço Cancelado';
            notificationBody = `${clientName} cancelou o serviço "${serviceData.title}"`;
            notificationTo = serviceData.providerId!;
          }
          break;
      }

      // Atualizar status do serviço
      await serviceRef.update({
        status,
        updatedAt: timestamp,
        ...(status === 'completed' && { completedAt: timestamp }),
      });

      // Criar notificação
      if (notificationTo) {
        await firestore().collection('notifications').add({
          userId: notificationTo,
          title: notificationTitle,
          body: notificationBody,
          serviceId,
          createdAt: timestamp,
          read: false,
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating service status:', error);
      throw error;
    }
  },

  // Criar novo serviço (demanda)
  createDemand: async (
    clientId: string,
    data: {
      title: string;
      serviceType: string;
      description: string;
      location: Location;
      preferredDate?: Date;
      photos?: { uri: string }[];
    }
  ) => {
    try {
      // Buscar informações do cliente
      const clientDoc = await firestore()
        .collection('users')
        .doc(clientId)
        .get();

      if (!clientDoc.exists) {
        throw new Error('Cliente não encontrado');
      }

      const clientData = clientDoc.data();

      // Salvar fotos no AsyncStorage
      const photoUrls: string[] = [];
      if (data.photos && data.photos.length > 0) {
        for (const [index, photo] of data.photos.entries()) {
          const photoKey = `demand_photo_${Date.now()}_${index}`;
          await AsyncStorage.setItem(photoKey, photo.uri);
          photoUrls.push(photoKey);
        }
      }

      // Criar a demanda
      const serviceData: Omit<ServiceRequest, 'id'> = {
        status: 'pending',
        title: data.title,
        serviceType: data.serviceType,
        description: data.description,
        location: data.location,
        preferredDate: data.preferredDate,
        photos: photoUrls,
        createdAt: new Date(),
        clientId,
        clientName: clientData?.name || '',
        value: 0,
      };

      const serviceRef = await firestore()
        .collection('services')
        .add(serviceData);

      return {
        id: serviceRef.id,
        ...serviceData,
      };
    } catch (error) {
      console.error('Error creating demand:', error);
      throw error;
    }
  },

  // Buscar demandas disponíveis por localização
  getAvailableDemands: async (
    providerLocation: Location,
    maxDistance: number = 10, // km
    serviceTypes?: string[]
  ) => {
    try {
      let query = firestore()
        .collection('services')
        .where('status', '==', 'pending')
        .where('providerId', '==', null);

      if (serviceTypes && serviceTypes.length > 0) {
        query = query.where('serviceType', 'in', serviceTypes);
      }

      const servicesSnapshot = await query.get();

      // Filtrar por distância
      const services = servicesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          preferredDate: doc.data().preferredDate?.toDate(),
        }))
        .filter(service => {
          const distance = calculateDistance(
            providerLocation.latitude,
            providerLocation.longitude,
            service.location.latitude,
            service.location.longitude
          );
          return distance <= maxDistance;
        })
        .sort((a, b) => {
          const distanceA = calculateDistance(
            providerLocation.latitude,
            providerLocation.longitude,
            a.location.latitude,
            a.location.longitude
          );
          const distanceB = calculateDistance(
            providerLocation.latitude,
            providerLocation.longitude,
            b.location.latitude,
            b.location.longitude
          );
          return distanceA - distanceB;
        });

      return services as ServiceRequest[];
    } catch (error) {
      console.error('Error getting available demands:', error);
      throw error;
    }
  },

  // Buscar demandas disponíveis
  getAvailableDemandsList: async () => {
    try {
      const demandsSnapshot = await firestore()
        .collection('services')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();

      return demandsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        preferredDate: doc.data().preferredDate?.toDate(),
      }));
    } catch (error) {
      console.error('Error getting available demands:', error);
      throw error;
    }
  },

  // Aceitar uma demanda
  acceptDemand: async (demandId: string, providerId: string) => {
    try {
      const providerDoc = await firestore()
        .collection('users')
        .doc(providerId)
        .get();

      if (!providerDoc.exists) {
        throw new Error('Prestador não encontrado');
      }

      const providerData = providerDoc.data();

      await firestore()
        .collection('services')
        .doc(demandId)
        .update({
          status: 'accepted',
          providerId,
          providerName: providerData?.name,
          acceptedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('Error accepting demand:', error);
      throw error;
    }
  },

  // Enviar mensagem no chat
  sendMessage: async (message: Omit<Message, 'id' | 'timestamp'>) => {
    try {
      await firestore().collection('messages').add({
        ...message,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Buscar mensagens de um serviço
  getMessages: async (serviceId: string) => {
    try {
      const messagesSnapshot = await firestore()
        .collection('messages')
        .where('serviceId', '==', serviceId)
        .orderBy('timestamp', 'asc')
        .get();

      return messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  // Propor novo valor
  proposeNewValue: async (serviceId: string, newValue: number, providerId: string) => {
    try {
      const serviceRef = firestore().collection('services').doc(serviceId);
      
      await serviceRef.update({
        status: 'negotiating',
        proposedValue: newValue,
      });

      // Enviar mensagem de proposta
      await ServiceService.sendMessage({
        serviceId,
        senderId: providerId,
        content: `Nova proposta de valor: R$ ${newValue.toFixed(2)}`,
        type: 'proposal',
        proposalValue: newValue,
      });

      return { error: null };
    } catch (error) {
      console.error('Error proposing new value:', error);
      throw error;
    }
  },

  // Aceitar proposta
  acceptProposal: async (serviceId: string) => {
    try {
      const serviceRef = firestore().collection('services').doc(serviceId);
      const serviceDoc = await serviceRef.get();
      const serviceData = serviceDoc.data() as ServiceRequest;

      await serviceRef.update({
        status: 'in_progress',
        value: serviceData.proposedValue,
        proposedValue: null,
      });

      return { error: null };
    } catch (error) {
      console.error('Error accepting proposal:', error);
      throw error;
    }
  },
};

// Função auxiliar para calcular distância entre dois pontos (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
