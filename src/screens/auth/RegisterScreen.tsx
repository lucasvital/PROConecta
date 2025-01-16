import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, useTheme, SegmentedButtons, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';

export const RegisterScreen = ({ navigation }: any) => {
  const [userType, setUserType] = useState('client');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const validateUsername = (username: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };

  const handleRegister = async () => {
    if (!name || !username || !email || !password) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!validateUsername(username)) {
      setError('Username deve ter entre 3 e 20 caracteres e conter apenas letras, números e _');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar se username já existe
      const usernameExists = await UserService.checkUsernameExists(username);
      if (usernameExists) {
        setError('Este username já está em uso');
        setLoading(false);
        return;
      }

      // Registrar usuário no Firebase Auth
      const { user, error: registerError } = await AuthService.register(email, password);
      
      if (registerError) {
        setError(registerError);
      } else if (user) {
        // Criar perfil do usuário no Firestore
        const { error: profileError } = await UserService.createUserProfile(user.uid, {
          name,
          username,
          email,
          userType: userType as 'client' | 'provider',
          phone,
          address,
        });

        if (profileError) {
          setError(profileError);
        } else {
          // Redirecionar baseado no tipo de usuário
          if (userType === 'client') {
            navigation.replace('ClientTutorial');
          } else {
            navigation.replace('ProviderForm');
          }
        }
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={{ color: theme.colors.primary }}>⚡</Text>
          <Text variant="headlineMedium">Criar Conta</Text>
        </View>

        <View style={styles.form}>
          <SegmentedButtons
            value={userType}
            onValueChange={setUserType}
            buttons={[
              { value: 'client', label: 'Cliente' },
              { value: 'provider', label: 'Prestador' },
            ]}
            style={styles.segment}
            disabled={loading}
          />

          <TextInput
            label="Nome completo"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError('');
            }}
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />

          <View>
            <TextInput
              label="Nome de usuário"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError('');
              }}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              error={!validateUsername(username)}
              disabled={loading}
            />
            {!validateUsername(username) ? (
              <HelperText type="error" visible={true}>
                Username deve ter entre 3 e 20 caracteres e conter apenas letras, números e _
              </HelperText>
            ) : (
              <HelperText type="info" visible={true}>
                Seu nome de usuário único para identificação no app
              </HelperText>
            )}
          </View>

          <TextInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Senha"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Telefone"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setError('');
            }}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Endereço"
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              setError('');
            }}
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />

          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            loading={loading}
            disabled={loading || !validateUsername(username) || !username || !name || !email || !password}
          >
            Cadastrar
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
            disabled={loading}
          >
            Já tenho uma conta
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
    marginTop: 40, // Um pouco menor no registro pois tem mais conteúdo
    marginBottom: 30,
  },
  form: {
    gap: 16,
  },
  segment: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
});
