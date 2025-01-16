import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, Chip, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserService } from '../../services/user';
import auth from '@react-native-firebase/auth';

const serviceCategories = [
  'Eletricista',
  'Encanador',
  'Pedreiro',
  'Pintor',
  'Marceneiro',
  'Serralheiro',
  'Jardineiro',
  'Gesseiro',
  'Vidraceiro',
];

export const ProviderFormScreen = ({ navigation }: any) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(prev => prev.filter(cat => cat !== category));
    } else {
      setSelectedCategories(prev => [...prev, category]);
    }
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      setError('Selecione pelo menos uma categoria');
      return;
    }

    if (!description.trim()) {
      setError('Adicione uma descrição dos seus serviços');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        setError('Usuário não autenticado');
        return;
      }

      const { error: updateError } = await UserService.updateProviderProfile(
        currentUser.uid,
        {
          categories: selectedCategories,
          description: description.trim(),
          experience: experience.trim(),
        }
      );

      if (updateError) {
        setError(updateError);
      } else {
        // Navegar para o tutorial
        navigation.replace('ProviderTutorial');
      }
    } catch (err) {
      setError('Erro ao salvar informações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
            Complete seu Perfil
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Ajude os clientes a encontrarem seus serviços
          </Text>
        </View>

        <View style={styles.form}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Categorias de Serviço
          </Text>
          <View style={styles.categories}>
            {serviceCategories.map(category => (
              <Chip
                key={category}
                selected={selectedCategories.includes(category)}
                onPress={() => toggleCategory(category)}
                style={styles.chip}
                mode="outlined"
              >
                {category}
              </Chip>
            ))}
          </View>

          <TextInput
            label="Descrição dos seus serviços"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="Ex: Sou eletricista há 10 anos, especializado em instalações residenciais..."
          />

          <TextInput
            label="Experiência e Certificações (opcional)"
            value={experience}
            onChangeText={setExperience}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="Ex: Curso técnico em elétrica, certificação NR10..."
          />

          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Continuar
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 10,
  },
  form: {
    gap: 20,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 20,
  },
});
