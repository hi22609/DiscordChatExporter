import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useMoveChat } from '@/hooks/useMoveChat';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/utils/time';
import type { ChatMessage } from '@/types/app';

interface MoveChatProps {
  moveId: string;
}

function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const name = msg.profile?.display_name || msg.profile?.username || '?';
  const initial = name[0].toUpperCase();

  return (
    <View style={{
      flexDirection: isMe ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: 12,
      paddingHorizontal: 16,
    }}>
      {/* Avatar — only for others */}
      {!isMe && (
        msg.profile?.avatar_url ? (
          <Image
            source={{ uri: msg.profile.avatar_url }}
            style={{ width: 30, height: 30, borderRadius: 15 }}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={{
            width: 30, height: 30, borderRadius: 15,
            backgroundColor: '#2E2E2E', alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#A0A0A0', fontSize: 12, fontWeight: '700' }}>{initial}</Text>
          </View>
        )
      )}

      {/* Bubble */}
      <View style={{ maxWidth: '72%', gap: 3 }}>
        {!isMe && (
          <Text style={{ color: '#606060', fontSize: 11, fontWeight: '600', paddingLeft: 4 }}>
            @{msg.profile?.username}
          </Text>
        )}
        <View style={{
          backgroundColor: isMe ? '#FF6B35' : '#1E1E1E',
          borderRadius: 18,
          borderBottomRightRadius: isMe ? 4 : 18,
          borderBottomLeftRadius: isMe ? 18 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}>
          <Text style={{ color: isMe ? '#fff' : '#FAFAFA', fontSize: 15, lineHeight: 21 }}>
            {msg.content}
          </Text>
        </View>
        <Text style={{
          color: '#3E3E3E', fontSize: 10,
          alignSelf: isMe ? 'flex-end' : 'flex-start',
          paddingHorizontal: 4,
        }}>
          {formatRelativeTime(msg.created_at)}
        </Text>
      </View>
    </View>
  );
}

export function MoveChat({ moveId }: MoveChatProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const { messages, isLoading, sendMutation, fetchOlder, hasOlder } = useMoveChat(moveId);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  function send() {
    const text = draft.trim();
    if (!text || sendMutation.isPending) return;
    setDraft('');
    sendMutation.mutate(text);
  }

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={120}
    >
      <View style={{ gap: 0 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 16, paddingBottom: 12,
        }}>
          <Ionicons name="chatbubbles-outline" size={16} color="#606060" />
          <Text style={{ color: '#606060', fontSize: 13, fontWeight: '600' }}>
            Move chat · attendees only
          </Text>
        </View>

        {/* Messages */}
        <View style={{ minHeight: 180, maxHeight: 340 }}>
          {messages.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 28 }}>💬</Text>
              <Text style={{ color: '#FAFAFA', fontSize: 15, fontWeight: '700' }}>
                No messages yet
              </Text>
              <Text style={{ color: '#606060', fontSize: 13 }}>
                Be the first to say something
              </Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => (
                <MessageBubble msg={item} isMe={item.user_id === userId} />
              )}
              onEndReached={hasOlder ? () => { void fetchOlder(); } : undefined}
              onEndReachedThreshold={0.1}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Input */}
        <View style={{
          flexDirection: 'row', alignItems: 'flex-end', gap: 10,
          paddingHorizontal: 16, paddingTop: 12,
          borderTopWidth: 0.5, borderTopColor: '#1E1E1E',
        }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Say something…"
            placeholderTextColor="#424242"
            multiline
            maxLength={500}
            style={{
              flex: 1, minHeight: 40, maxHeight: 100,
              backgroundColor: '#1E1E1E',
              borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
              color: '#FAFAFA', fontSize: 15,
              borderWidth: 1, borderColor: '#2A2A2A',
            }}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={send}
          />
          <TouchableOpacity
            onPress={send}
            disabled={!draft.trim() || sendMutation.isPending}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: draft.trim() ? '#FF6B35' : '#1E1E1E',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {sendMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="arrow-up" size={18} color={draft.trim() ? '#fff' : '#424242'} />
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
