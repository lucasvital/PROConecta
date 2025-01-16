import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../services/auth';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { user, error: loginError } = await AuthService.login(email, password);
      
      if (loginError) {
        setError(loginError);
      } else if (user) {
        // TODO: Navegar para a tela principal
        console.log('Login successful:', user.uid);
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Digite seu email para recuperar a senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await AuthService.resetPassword(email);
      
      if (resetError) {
        setError(resetError);
      } else {
        // TODO: Mostrar mensagem de sucesso
        console.log('Password reset email sent');
      }
    } catch (err) {
      setError('Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="displaySmall" style={{ color: theme.colors.primary }}>⚡</Text>
        <Text variant="headlineMedium">PRO Conecta</Text>
        <Text variant="bodyLarge" style={{ textAlign: 'center' }}>Conectando você aos melhores {"\n"}<Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>profissionais</Text></Text>
      </View>

      <View style={styles.form}>
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

        {error ? (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          Entrar
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Register')}
          style={styles.button}
          disabled={loading}
        >
          Criar conta
        </Button>

        <Button
          mode="text"
          onPress={handleForgotPassword}
          disabled={loading}
        >
          Esqueci minha senha
        </Button>
      </View>
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
    marginTop: 60, // Aumentado para compensar a barra de status
    marginBottom: 40,
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
});
