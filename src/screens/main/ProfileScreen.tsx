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
  id: string;
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
      setLoading(true);
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      const userProfile = await UserService.getUserProfile(currentUser.uid);
      if (userProfile) {
        setProfile(userProfile);
      }

      // Carregar foto do perfil
      try {
        const photoUri = await AsyncStorage.getItem(`profilePhoto_${currentUser.uid}`);
        if (photoUri) {
          setProfileImage(photoUri);
        }
      } catch (error) {
        console.error('Error loading profile photo:', error);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        {loading ? (
          <Text>Carregando...</Text>
        ) : profile ? (
          <>
            <View style={styles.profileHeader}>
              {profileImage ? (
                <Avatar.Image
                  size={100}
                  source={{ uri: profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Icon
                  size={100}
                  icon="account"
                  style={styles.avatar}
                />
              )}
              <View style={styles.nameContainer}>
                {isEditing ? (
                  <TextInput
                    value={editedName}
                    onChangeText={setEditedName}
                    style={styles.nameInput}
                  />
                ) : (
                  <Text variant="headlineMedium">{profile.name}</Text>
                )}
                <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
                  {profile.userType === 'client' ? 'Cliente' : 'Prestador'}
                </Text>
              </View>
              <IconButton
                icon={isEditing ? 'check' : 'pencil'}
                onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}
              />
            </View>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Sobre</Text>
                {isEditing ? (
                  <TextInput
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    multiline
                    numberOfLines={4}
                    style={styles.descriptionInput}
                  />
                ) : (
                  <Text variant="bodyMedium" style={styles.description}>
                    {profile.description || 'Nenhuma descrição fornecida'}
                  </Text>
                )}
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Estatísticas
                </Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Icon name="star" size={24} color={theme.colors.primary} />
                    <Text variant="titleLarge">
                      {profile.userType === 'client' 
                        ? profile.clientRating?.toFixed(1) || '0.0'
                        : profile.rating?.toFixed(1) || '0.0'}
                    </Text>
                    <Text variant="bodyMedium">Avaliação</Text>
                  </View>

                  <View style={styles.statItem}>
                    <Icon 
                      name={profile.userType === 'client' ? 'clipboard-list' : 'check-circle'} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                    <Text variant="titleLarge">
                      {profile.userType === 'client' 
                        ? profile.totalServicesRequested || 0
                        : profile.servicesCompleted || 0}
                    </Text>
                    <Text variant="bodyMedium">
                      {profile.userType === 'client' 
                        ? 'Serviços Solicitados' 
                        : 'Serviços Concluídos'}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            <List.Section>
              <List.Item
                title="Histórico de Serviços"
                left={props => <List.Icon {...props} icon="history" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('ServiceHistory', { userType: profile.userType })}
              />
              <List.Item
                title="Avaliações"
                left={props => <List.Icon {...props} icon="star" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('Reviews', { userId: profile.id, userType: profile.userType })}
              />
              <List.Item
                title="Configurações"
                left={props => <List.Icon {...props} icon="cog" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => {/* TODO: Implementar tela de configurações */}}
              />
              <List.Item
                title="Sair"
                left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
                onPress={handleLogout}
                titleStyle={{ color: theme.colors.error }}
              />
            </List.Section>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  avatar: {
    marginRight: 16,
  },
  nameContainer: {
    flex: 1,
  },
  nameInput: {
    width: '100%',
    marginBottom: 8,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: 16,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
});
