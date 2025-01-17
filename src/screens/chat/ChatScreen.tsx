import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, useTheme, TextInput, Button, Portal, Modal, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { ServiceService, Message, ServiceRequest } from '../../services/service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const ChatScreen = ({ route, navigation }: any) => {
  const theme = useTheme();
  const { serviceId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [service, setService] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth().currentUser;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar serviço
      const serviceDoc = await ServiceService.getServiceById(serviceId);
      setService(serviceDoc);

      // Carregar mensagens
      const messagesData = await ServiceService.getMessages(serviceId);
      setMessages(messagesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chat data:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      await ServiceService.sendMessage({
        serviceId,
        senderId: currentUser.uid,
        content: newMessage.trim(),
        type: 'text',
      });

      setNewMessage('');
      loadData(); // Recarregar mensagens
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUser?.uid;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="titleMedium">{service?.title}</Text>
        <Chip
          mode="flat"
          textStyle={{ color: '#FFFFFF' }}
          style={[styles.statusChip, { backgroundColor: theme.colors.primary }]}
        >
          {service?.status === 'accepted' ? 'Aceito' : 'Em Andamento'}
        </Chip>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id || item.timestamp.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Digite sua mensagem..."
            style={styles.input}
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusChip: {
    height: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFD700',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    backgroundColor: 'transparent',
  },
});
