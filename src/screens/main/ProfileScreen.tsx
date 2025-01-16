import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TextInput } from 'react-native';
import { Text, useTheme, Avatar, Button, Card, Divider, List, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { UserService } from '../../services/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

interface UserProfile {
  name: string;
  email: string;
  userType: 'client' | 'provider';
  description?: string;
  rating?: number;
  servicesCompleted?: number;
  hasPhoto?: boolean;
  clientRating?: number;
  totalServicesRequested?: number;
}

export const ProfileScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setEditedName(profile.name);
      setEditedDescription(profile.description || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      await UserService.updateUserProfile(currentUser.uid, {
        name: editedName,
        description: editedDescription,
      });

      // Atualiza o perfil local
      setProfile(prev => prev ? {
        ...prev,
        name: editedName,
        description: editedDescription,
      } : null);

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      // Carregar dados do perfil
      const userData = await UserService.getUserProfile(currentUser.uid);
      if (userData) {
        // Carregar avaliações
        const ratings = await UserService.getUserRatings(currentUser.uid, userData.userType);
        
        // Calcular média e total
        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0 
          ? ratings.reduce((acc, r) => acc + r.rating, 0) / totalRatings 
          : 0;

        // Atualizar perfil com dados calculados
        const updatedProfile = {
          ...userData,
          rating: userData.userType === 'provider' ? averageRating : userData.rating,
          clientRating: userData.userType === 'client' ? averageRating : userData.clientRating,
          servicesCompleted: userData.userType === 'provider' ? totalRatings : userData.servicesCompleted,
          totalServicesRequested: userData.userType === 'client' ? totalRatings : userData.totalServicesRequested,
        };
        
        setProfile(updatedProfile);
        
        // Carregar foto do perfil se existir
        if (userData.hasPhoto) {
          const photoUri = await AsyncStorage.getItem(`@user_photo_${currentUser.uid}`);
          setProfileImage(photoUri);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await auth().signOut();
      }
      // Sempre navega para login, mesmo se não houver usuário
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderProviderProfile = () => (
    <ScrollView style={styles.scrollView}>
      <View style={styles.header}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={styles.profileImage}
          />
        ) : (
          <Avatar.Icon
            size={120}
            icon="account"
            style={{ backgroundColor: theme.colors.surfaceVariant }}
          />
        )}
        {isEditing ? (
          <TextInput
            value={editedName}
            onChangeText={setEditedName}
            style={styles.nameInput}
            mode="outlined"
          />
        ) : (
          <Text variant="headlineSmall" style={styles.name}>
            {profile?.name}
          </Text>
        )}
        <View style={styles.ratingContainer}>
          <Icon name="star" size={24} color={theme.colors.primary} />
          <Text 
            variant="titleMedium"
            onPress={() => navigation.navigate('Reviews', { userType: 'provider' })}
          >
            {profile?.rating?.toFixed(1) || '0.0'} ({profile?.servicesCompleted || 0} serviços)
          </Text>
        </View>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Sobre mim
            </Text>
            {!isEditing && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => setIsEditing(true)}
              />
            )}
          </View>
          {isEditing ? (
            <View>
              <TextInput
                value={editedDescription}
                onChangeText={setEditedDescription}
                placeholder="Conte um pouco sobre você..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                multiline
                numberOfLines={4}
                style={[
                  styles.descriptionInput,
                  { 
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.onSurface
                  }
                ]}
              />
              <View style={styles.editButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsEditing(false);
                    setEditedDescription(profile?.description || '');
                  }}
                  style={styles.editButton}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  style={styles.editButton}
                >
                  Salvar
                </Button>
              </View>
            </View>
          ) : (
            <Text variant="bodyMedium" style={styles.description}>
              {profile?.description || 'Nenhuma descrição fornecida'}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Serviços Realizados
          </Text>
          <List.Item
            title="Total de serviços"
            left={props => <List.Icon {...props} icon="briefcase-outline" />}
            right={() => <Text>{profile?.servicesCompleted || 0}</Text>}
            onPress={() => navigation.navigate('ServiceHistory', { userType: 'provider' })}
          />
          <Divider />
          <List.Item
            title="Avaliação média"
            left={props => <List.Icon {...props} icon="star-outline" />}
            right={() => <Text>{profile?.rating?.toFixed(1) || '0.0'}</Text>}
            onPress={() => navigation.navigate('Reviews', { userType: 'provider' })}
          />
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Sair
      </Button>
    </ScrollView>
  );

  const renderClientProfile = () => (
    <ScrollView style={styles.scrollView}>
      <View style={styles.header}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={styles.profileImage}
          />
        ) : (
          <Avatar.Icon
            size={120}
            icon="account"
            style={{ backgroundColor: theme.colors.surfaceVariant }}
          />
        )}
        {isEditing ? (
          <TextInput
            value={editedName}
            onChangeText={setEditedName}
            style={styles.nameInput}
            mode="outlined"
          />
        ) : (
          <Text variant="headlineSmall" style={styles.name}>
            {profile?.name}
          </Text>
        )}
        <View style={styles.ratingContainer}>
          <Icon name="star" size={24} color={theme.colors.primary} />
          <Text 
            variant="titleMedium"
            onPress={() => navigation.navigate('Reviews', { userType: 'client' })}
          >
            {profile?.clientRating?.toFixed(1) || '0.0'} (como cliente)
          </Text>
        </View>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Meus Dados
            </Text>
            {!isEditing && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => setIsEditing(true)}
              />
            )}
          </View>
          <List.Item
            title="Email"
            description={profile?.email}
            left={props => <List.Icon {...props} icon="email-outline" />}
          />
          {isEditing && (
            <View style={styles.editButtons}>
              <Button
                mode="outlined"
                onPress={() => setIsEditing(false)}
                style={styles.editButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                style={styles.editButton}
              >
                Salvar
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Histórico e Avaliações
          </Text>
          <List.Item
            title="Serviços solicitados"
            left={props => <List.Icon {...props} icon="history" />}
            right={() => <Text>{profile?.totalServicesRequested || 0}</Text>}
            onPress={() => navigation.navigate('ServiceHistory', { userType: 'client' })}
          />
          <Divider />
          <List.Item
            title="Avaliação como cliente"
            left={props => <List.Icon {...props} icon="star-outline" />}
            right={() => <Text>{profile?.clientRating?.toFixed(1) || '0.0'}</Text>}
            onPress={() => navigation.navigate('Reviews', { userType: 'client' })}
          />
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Sair
      </Button>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {profile?.userType === 'provider' ? renderProviderProfile() : renderClientProfile()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  logoutButton: {
    margin: 16,
  },
  ratingInfo: {
    marginTop: 8,
    marginLeft: 16,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nameInput: {
    width: '80%',
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  editButton: {
    minWidth: 100,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  description: {
    lineHeight: 24,
  },
});
