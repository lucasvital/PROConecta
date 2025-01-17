import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  userType: 'client' | 'provider';
  createdAt: Date;
  updatedAt: Date;
  hasPhoto?: boolean;
}

export interface ProviderProfile extends UserProfile {
  categories: string[];
  description: string;
  experience?: string;
  rating?: number;
  totalRatings?: number;
}

export const UserService = {
  // Criar perfil de usuário (comum para ambos os tipos)
  createUserProfile: async (
    uid: string,
    data: {
      name: string;
      username: string;
      email: string;
      phone?: string;
      address?: string;
      userType: 'client' | 'provider';
    }
  ) => {
    try {
      const userProfile: UserProfile = {
        uid,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const doc = await firestore()
        .collection('users')
        .doc(uid)
        .get();

      if (!doc.exists) {
        return { profile: null, error: 'Perfil não encontrado' };
      }

      const profile = doc.data() as UserProfile | ProviderProfile;
      return { profile, error: null };
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      return { profile: null, error: 'Erro ao buscar perfil do usuário' };
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
};
