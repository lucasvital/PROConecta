import auth from '@react-native-firebase/auth';
import '../config/firebase';

export const AuthService = {
  // Registrar novo usuário
  register: async (email: string, password: string) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      let errorMessage = 'Erro ao criar conta';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está em uso';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operação não permitida';
          break;
        case 'auth/weak-password':
          errorMessage = 'A senha deve ter pelo menos 6 caracteres';
          break;
      }
      
      return { user: null, error: errorMessage };
    }
  },

  // Login de usuário
  login: async (email: string, password: string) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      let errorMessage = 'Erro ao fazer login';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuário desativado';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta';
          break;
      }
      
      return { user: null, error: errorMessage };
    }
  },

  // Logout
  logout: async () => {
    try {
      await auth().signOut();
      return { error: null };
    } catch (error) {
      return { error: 'Erro ao fazer logout' };
    }
  },

  // Recuperar senha
  resetPassword: async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
      return { error: null };
    } catch (error: any) {
      let errorMessage = 'Erro ao enviar email de recuperação';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
      }
      
      return { error: errorMessage };
    }
  },

  // Observar mudanças no estado de autenticação
  onAuthStateChanged: (callback: (user: any) => void) => {
    return auth().onAuthStateChanged(callback);
  },
};
