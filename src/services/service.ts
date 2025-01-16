import firestore from '@react-native-firebase/firestore';

export interface ServiceRequest {
  id: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  serviceType: string;
  description: string;
  createdAt: Date;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  price?: number;
  completedAt?: Date;
  clientRating?: number;
  clientComment?: string;
  clientRatedAt?: Date;
  providerRating?: number;
  providerComment?: string;
  providerRatedAt?: Date;
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
      })) as ServiceRequest[];
    } catch (error) {
      console.error('Error getting user services:', error);
      throw error;
    }
  },

  // Atualizar status do serviço
  updateServiceStatus: async (serviceId: string, status: ServiceRequest['status']) => {
    try {
      await firestore()
        .collection('services')
        .doc(serviceId)
        .update({
          status,
          ...(status === 'completed' ? { completedAt: new Date() } : {}),
        });

      return { success: true };
    } catch (error) {
      console.error('Error updating service status:', error);
      throw error;
    }
  },

  // Criar novo serviço
  createService: async (
    clientId: string,
    providerId: string,
    data: {
      serviceType: string;
      description: string;
      price?: number;
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

      // Buscar informações do prestador
      const providerDoc = await firestore()
        .collection('users')
        .doc(providerId)
        .get();

      if (!providerDoc.exists) {
        throw new Error('Prestador não encontrado');
      }

      const clientData = clientDoc.data();
      const providerData = providerDoc.data();

      // Criar o serviço
      const serviceData: Omit<ServiceRequest, 'id'> = {
        status: 'pending',
        serviceType: data.serviceType,
        description: data.description,
        price: data.price,
        createdAt: new Date(),
        clientId,
        clientName: clientData?.name || '',
        providerId,
        providerName: providerData?.name || '',
      };

      const serviceRef = await firestore()
        .collection('services')
        .add(serviceData);

      return {
        id: serviceRef.id,
        ...serviceData,
      };
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },
};
