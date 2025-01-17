import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, Card, IconButton, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import { UserService } from '../../services/user';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  reviewerName: string;
  reviewerPhoto?: string;
  serviceType: string;
}

export const ReviewsScreen = ({ route, navigation }: any) => {
  const { userType } = route.params;
  const theme = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      const userRatings = await UserService.getUserRatings(currentUser.uid, userType);
      setReviews(userRatings);

      if (userRatings.length > 0) {
        const avg = userRatings.reduce((acc, rev) => acc + rev.rating, 0) / userRatings.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const renderStars = (rating: number) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          size={16}
          color={star <= rating ? theme.colors.primary : theme.colors.surfaceVariant}
        />
      ))}
    </View>
  );

  const renderReviewCard = (review: Review) => (
    <Card key={review.id} style={styles.card}>
      <Card.Content>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            {review.reviewerPhoto ? (
              <Avatar.Image size={40} source={{ uri: review.reviewerPhoto }} />
            ) : (
              <Avatar.Icon size={40} icon="account" />
            )}
            <View style={styles.reviewerDetails}>
              <Text variant="bodyLarge">{review.reviewerName}</Text>
              <Text variant="bodySmall" style={styles.date}>
                {review.createdAt.toLocaleDateString()}
              </Text>
            </View>
          </View>
          {renderStars(review.rating)}
        </View>

        <View style={styles.serviceType}>
          <Icon name="briefcase-outline" size={16} color={theme.colors.primary} />
          <Text variant="bodySmall" style={styles.serviceTypeText}>
            {review.serviceType}
          </Text>
        </View>

        <Text variant="bodyMedium" style={styles.comment}>
          {review.comment}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }]}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineSmall">Avaliações</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.averageContainer}>
        <Text variant="displaySmall" style={styles.averageRating}>
          {averageRating.toFixed(1)}
        </Text>
        {renderStars(averageRating)}
        <Text variant="bodyMedium">
          {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
        </Text>
      </View>

      <Divider style={styles.divider} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma avaliação ainda
          </Text>
        ) : (
          reviews.map(renderReviewCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageContainer: {
    alignItems: 'center',
    padding: 16,
  },
  averageRating: {
    marginBottom: 8,
  },
  divider: {
    marginHorizontal: 16,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerDetails: {
    marginLeft: 12,
  },
  date: {
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  serviceType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  serviceTypeText: {
    marginLeft: 8,
  },
  comment: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
  },
});
