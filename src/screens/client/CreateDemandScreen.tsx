import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import { Text, useTheme, TextInput, Button, IconButton, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { ServiceService, Location as ServiceLocation } from '../../services/service';
import { useNavigation } from '@react-navigation/native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import * as ExpoLocation from 'expo-location';

export const CreateDemandScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<ServiceLocation | null>(null);
  const [preferredDate, setPreferredDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [locationType, setLocationType] = useState('current'); // 'current' ou 'custom'
  const [customAddress, setCustomAddress] = useState('');
  const [currentLocation, setCurrentLocation] = useState<ServiceLocation | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await ExpoLocation.getCurrentPositionAsync({});
        const address = await getAddressFromCoords(location.coords.latitude, location.coords.longitude);
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address,
        });
      }
    })();
  }, []);

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const [address] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      return `${address.street}, ${address.streetNumber}, ${address.city}, ${address.region}`;
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Endereço não encontrado';
    }
  };

  const getCoordsFromAddress = async (address: string) => {
    try {
      const results = await ExpoLocation.geocodeAsync(address);
      if (results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }
      throw new Error('Endereço não encontrado');
    } catch (error) {
      console.error('Error getting coordinates:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0]]);
    }
  };

  const handleCreateDemand = async () => {
    if (!title || !serviceType || !description) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      let serviceLocation: ServiceLocation;
      if (locationType === 'current') {
        if (!currentLocation) {
          alert('Não foi possível obter sua localização atual');
          return;
        }
        serviceLocation = currentLocation;
      } else {
        if (!customAddress) {
          alert('Por favor, informe o endereço');
          return;
        }
        try {
          const coords = await getCoordsFromAddress(customAddress);
          serviceLocation = {
            ...coords,
            address: customAddress,
          };
        } catch (error) {
          alert('Não foi possível encontrar o endereço informado');
          return;
        }
      }

      await ServiceService.createDemand(currentUser.uid, {
        title,
        serviceType,
        description,
        location: serviceLocation,
        preferredDate: preferredDate || undefined,
        photos,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error creating demand:', error);
      alert('Erro ao criar demanda');
    } finally {
      setLoading(false);
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
        <Text variant="headlineSmall">Nova Demanda</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <TextInput
          label="Título do Serviço"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        <TextInput
          label="Tipo de Serviço"
          value={serviceType}
          onChangeText={setServiceType}
          style={styles.input}
        />

        <TextInput
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <View style={styles.locationContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Localização</Text>
          <RadioButton.Group onValueChange={value => setLocationType(value)} value={locationType}>
            <View style={styles.radioOption}>
              <RadioButton value="current" />
              <Text>Usar localização atual</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="custom" />
              <Text>Informar endereço</Text>
            </View>
          </RadioButton.Group>

          {locationType === 'current' ? (
            <View style={styles.currentLocation}>
              <Text>{currentLocation?.address || 'Carregando localização...'}</Text>
            </View>
          ) : (
            <TextInput
              label="Endereço"
              value={customAddress}
              onChangeText={setCustomAddress}
              placeholder="Digite o endereço completo"
              style={styles.input}
            />
          )}
        </View>

        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          icon="calendar"
          style={styles.input}
        >
          {preferredDate ? preferredDate.toLocaleDateString() : 'Data Preferida (Opcional)'}
        </Button>

        {Platform.OS === 'android' ? (
          showDatePicker && (
            <RNDateTimePicker
              value={preferredDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setPreferredDate(date);
                }
              }}
              minimumDate={new Date()}
            />
          )
        ) : (
          <RNDateTimePicker
            value={preferredDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              if (date) {
                setPreferredDate(date);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        <View style={styles.photosSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Fotos (Opcional)
          </Text>
          <ScrollView horizontal style={styles.photosList}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photo} />
                <IconButton
                  icon="close"
                  size={20}
                  style={styles.removePhoto}
                  onPress={() => {
                    const newPhotos = [...photos];
                    newPhotos.splice(index, 1);
                    setPhotos(newPhotos);
                  }}
                />
              </View>
            ))}
            {photos.length < 5 && (
              <Button
                mode="outlined"
                onPress={pickImage}
                icon="camera"
                style={styles.addPhotoButton}
              >
                Adicionar Foto
              </Button>
            )}
          </ScrollView>
        </View>

        <Button
          mode="contained"
          onPress={handleCreateDemand}
          style={styles.submitButton}
          loading={loading}
          disabled={loading}
        >
          Criar Demanda
        </Button>
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
  contentContainer: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  locationContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  currentLocation: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  photosSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  photosList: {
    flexDirection: 'row',
  },
  photoContainer: {
    marginRight: 8,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    margin: 0,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    justifyContent: 'center',
  },
  submitButton: {
    marginVertical: 24,
  },
});
