import React, { useCallback } from 'react';
import { FlatList, View, Text, RefreshControl, ActivityIndicator } from 'react-native';
import { MoveCard } from '@/components/moves/MoveCard';
import { MoveCardSkeleton } from '@/components/ui/Skeleton';
import { useNearbyMoves } from '@/hooks/useNearbyMoves';
import type { NearbyMove } from '@/types/app';

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center gap-4 py-20">
      <Text style={{ fontSize: 48 }}>🏙️</Text>
      <Text className="text-ink font-bold text-xl">No moves yet</Text>
      <Text className="text-ink-muted text-center text-base" style={{ maxWidth: 240, lineHeight: 22 }}>
        Be the first to set the move for today. Post something and get people moving.
      </Text>
    </View>
  );
}

export function FeedList() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isRefetching } =
    useNearbyMoves();

  const moves: NearbyMove[] = data?.pages.flat() ?? [];

  const renderItem = useCallback(
    ({ item, index }: { item: NearbyMove; index: number }) => (
      <MoveCard move={item} index={index} />
    ),
    []
  );

  const keyExtractor = useCallback((item: NearbyMove) => item.id, []);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View className="px-4 pt-2">
        {[0, 1, 2].map((i) => <MoveCardSkeleton key={i} />)}
      </View>
    );
  }

  return (
    <FlatList
      data={moves}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      removeClippedSubviews
      maxToRenderPerBatch={6}
      windowSize={7}
      initialNumToRender={5}
      updateCellsBatchingPeriod={40}
      ListEmptyComponent={EmptyState}
      ListFooterComponent={
        isFetchingNextPage
          ? <ActivityIndicator color="#FF6B35" style={{ paddingVertical: 16 }} />
          : null
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isLoading}
          onRefresh={refetch}
          tintColor="#FF6B35"
        />
      }
    />
  );
}
