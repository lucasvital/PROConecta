import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, useTheme, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { UserService } from '../../services/user';

export const ProfilePhotoScreen = ({ navigation }: any) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Precisamos de permissão para usar a câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      if (image) {
        // Salvar a imagem no AsyncStorage
        await AsyncStorage.setItem(`@user_photo_${currentUser.uid}`, image);
        
        // Atualizar o perfil do usuário com um flag indicando que tem foto
        await UserService.updateUserPhoto(currentUser.uid, true);
      }

      // Navegar para a tela principal
      navigation.replace('MainApp');
    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      alert('Erro ao salvar foto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Foto de Perfil
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Adicione uma foto para seu perfil
        </Text>

        <View style={styles.photoContainer}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.photo}
            />
          ) : (
            <Avatar.Icon
              size={150}
              icon="account"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            />
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={takePhoto}
            style={styles.button}
            icon="camera"
          >
            Tirar Foto
          </Button>
          <Button
            mode="outlined"
            onPress={pickImage}
            style={styles.button}
            icon="image"
          >
            Escolher Foto
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.continueButton}
          loading={loading}
        >
          {image ? 'Continuar' : 'Pular'}
        </Button>
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
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
  },
  photoContainer: {
    marginBottom: 40,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    width: '100%',
  },
  continueButton: {
    width: '100%',
    marginTop: 20,
  },
});
