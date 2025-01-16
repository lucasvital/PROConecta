import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  userType: 'client' | 'provider';
  description?: string;
  rating?: number;
  servicesCompleted?: number;
  hasPhoto?: boolean;
  clientRating?: number;
  totalServicesRequested?: number;
  totalClientRatings?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderProfile extends UserProfile {
  categories: string[];
  experience?: string;
  totalRatings?: number;
}

interface RatingData {
  rating: number;
  comment?: string;
  serviceId: string;
  serviceType: string;
  createdAt: Date;
}

export const UserService = {
  // Criar perfil de usuário (comum para ambos os tipos)
  createUserProfile: async (
    uid: string,
    data: {
      name: string;
      username: string;
      email: string;
      userType: 'client' | 'provider';
    }
  ) => {
    try {
      const userProfile: UserProfile = {
        id: uid,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        rating: 0,
        clientRating: 0,
        servicesCompleted: 0,
        totalServicesRequested: 0,
        totalClientRatings: 0,
      };

      await firestore()
        .collection('users')
        .doc(uid)
        .set(userProfile);

      return { profile: userProfile, error: null };
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      return { profile: null, error: 'Erro ao criar perfil do usuário' };
    }
  },

  // Atualizar perfil do prestador
  updateProviderProfile: async (
    uid: string,
    data: {
      categories: string[];
      description: string;
      experience?: string;
    }
  ) => {
    try {
      const providerData = {
        ...data,
        rating: 0,
        totalRatings: 0,
        updatedAt: new Date(),
      };

      await firestore()
        .collection('users')
        .doc(uid)
        .update(providerData);

      return { error: null };
    } catch (error: any) {
      console.error('Error updating provider profile:', error);
      return { error: 'Erro ao atualizar perfil do prestador' };
    }
  },

  // Buscar perfil do usuário
  getUserProfile: async (uid: string) => {
    try {
      const userDoc = await firestore()
        .collection('users')
        .doc(uid)
        .get();

      if (!userDoc.exists) {
        throw new Error('Usuário não encontrado');
      }

      const userData = userDoc.data() as UserProfile;
      return {
        ...userData,
        id: userDoc.id,
        createdAt: userData.createdAt.toDate(),
        updatedAt: userData.updatedAt.toDate(),
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Verificar se username já existe
  checkUsernameExists: async (username: string) => {
    try {
      const snapshot = await firestore()
        .collection('users')
        .where('username', '==', username)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  },

  // Buscar prestadores por categoria
  getProvidersByCategory: async (category: string) => {
    try {
      const snapshot = await firestore()
        .collection('users')
        .where('userType', '==', 'provider')
        .where('categories', 'array-contains', category)
        .get();

      return snapshot.docs.map(doc => doc.data() as ProviderProfile);
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  },

  // Atualizar flag de foto do usuário
  updateUserPhoto: async (uid: string, hasPhoto: boolean) => {
    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .update({
          hasPhoto,
          updatedAt: new Date(),
        });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating user photo:', error);
      return { error: 'Erro ao atualizar foto do usuário' };
    }
  },

  // Atualizar perfil do usuário
  updateUserProfile: async (
    uid: string,
    data: {
      name?: string;
      description?: string;
    }
  ) => {
    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .update({
          ...data,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Atualizar avaliação do prestador
  updateProviderRating: async (
    providerId: string,
    clientId: string,
    ratingData: {
      rating: number;
      comment: string;
      serviceId: string;
    }
  ) => {
    try {
      // Adiciona a avaliação na coleção de avaliações
      await firestore()
        .collection('ratings')
        .add({
          providerId,
          clientId,
          rating: ratingData.rating,
          comment: ratingData.comment,
          serviceId: ratingData.serviceId,
          createdAt: new Date(),
        });

      // Atualiza o serviço com a avaliação
      await firestore()
        .collection('services')
        .doc(ratingData.serviceId)
        .update({
          clientRating: ratingData.rating,
          clientComment: ratingData.comment,
          clientRatedAt: new Date(),
        });

      // Atualiza a média do prestador
      const ratingsSnapshot = await firestore()
        .collection('ratings')
        .where('providerId', '==', providerId)
        .get();

      const ratings = ratingsSnapshot.docs.map(doc => doc.data().rating);
      const averageRating = ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;

      await firestore()
        .collection('users')
        .doc(providerId)
        .update({
          rating: averageRating,
          totalRatings: ratings.length,
          updatedAt: new Date(),
        });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating provider rating:', error);
      return { error: 'Erro ao atualizar avaliação do prestador' };
    }
  },

  // Atualizar avaliação do cliente
  updateClientRating: async (
    clientId: string,
    providerId: string,
    ratingData: {
      rating: number;
      comment: string;
      serviceId: string;
    }
  ) => {
    try {
      // Adiciona a avaliação na coleção de avaliações de clientes
      await firestore()
        .collection('client_ratings')
        .add({
          clientId,
          providerId,
          rating: ratingData.rating,
          comment: ratingData.comment,
          serviceId: ratingData.serviceId,
          createdAt: new Date(),
        });

      // Atualiza o serviço com a avaliação
      await firestore()
        .collection('services')
        .doc(ratingData.serviceId)
        .update({
          providerRating: ratingData.rating,
          providerComment: ratingData.comment,
          providerRatedAt: new Date(),
        });

      // Atualiza a média do cliente
      const ratingsSnapshot = await firestore()
        .collection('client_ratings')
        .where('clientId', '==', clientId)
        .get();

      const ratings = ratingsSnapshot.docs.map(doc => doc.data().rating);
      const averageRating = ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;

      await firestore()
        .collection('users')
        .doc(clientId)
        .update({
          clientRating: averageRating,
          totalClientRatings: ratings.length,
          updatedAt: new Date(),
        });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating client rating:', error);
      return { error: 'Erro ao atualizar avaliação do cliente' };
    }
  },

  // Buscar avaliações do usuário
  getUserRatings: async (userId: string, userType: 'client' | 'provider') => {
    try {
      const collection = userType === 'provider' ? 'ratings' : 'client_ratings';
      const field = userType === 'provider' ? 'providerId' : 'clientId';

      const ratingsSnapshot = await firestore()
        .collection(collection)
        .where(field, '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const ratings = await Promise.all(
        ratingsSnapshot.docs.map(async doc => {
          const data = doc.data();
          const reviewerId = userType === 'provider' ? data.clientId : data.providerId;

          // Busca informações do avaliador
          const reviewerDoc = await firestore()
            .collection('users')
            .doc(reviewerId)
            .get();

          const reviewerData = reviewerDoc.data();

          // Busca informações do serviço
          const serviceDoc = await firestore()
            .collection('services')
            .doc(data.serviceId)
            .get();

          const serviceData = serviceDoc.data();

          return {
            id: doc.id,
            rating: data.rating,
            comment: data.comment,
            createdAt: data.createdAt.toDate(),
            reviewerName: reviewerData?.name || 'Usuário',
            reviewerPhoto: reviewerData?.hasPhoto ? `users/${reviewerId}/photo` : undefined,
            serviceType: serviceData?.serviceType || 'Serviço',
          };
        })
      );

      return ratings;
    } catch (error) {
      console.error('Error getting user ratings:', error);
      throw error;
    }
  },
};
