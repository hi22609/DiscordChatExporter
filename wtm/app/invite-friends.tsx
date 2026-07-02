import React from 'react';
import { View, Text, TouchableOpacity, Share, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMyInvite, useMyReferrals } from '@/hooks/useInvites';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime } from '@/utils/time';

export default function InviteFriendsScreen() {
  const router = useRouter();
  const { data: invite, isLoading } = useMyInvite();
  const { data: referrals = [] } = useMyReferrals();
  const [copied, setCopied] = React.useState(false);

  const code = invite?.code ?? '••••••••';
  const invitesLeft = invite?.invites_left ?? 0;
  const totalInvites = invite?.max_uses ?? 5;
  const shareUrl = `https://whatsthemove.app/i/${invite?.code ?? ''}`;

  async function handleCopy() {
    if (!invite?.code) return;
    await Clipboard.setStringAsync(invite.code);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleShare() {
    if (!invite?.code) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({
      message: `Come find the move with me on WTM 🔥 Use my invite code ${invite.code} to get in: ${shareUrl}`,
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <LinearGradient
        colors={['#FF6B3530', '#7C3AED18', '#0A0A0A']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: -80, left: -80, right: -80, height: 380, borderRadius: 500 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingTop: 8, gap: 28 }}>
          <Animated.View entering={FadeInDown.springify()} style={{ gap: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 52 }}>🎟️</Text>
            <Text style={{ fontSize: 30, fontWeight: '900', color: '#FAFAFA', letterSpacing: -1, textAlign: 'center' }}>
              Bring your people in
            </Text>
            <Text style={{ color: '#A0A0A0', fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 300 }}>
              WTM is invite-only. You've got {totalInvites} spots to hand out — pass them to the people who make the move.
            </Text>
          </Animated.View>

          {isLoading ? (
            <ActivityIndicator color="#FF6B35" style={{ marginVertical: 40 }} />
          ) : (
            <>
              {/* The code card */}
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <View style={{
                  backgroundColor: '#1E1E1E', borderRadius: 24, padding: 20, gap: 16,
                  borderWidth: 1, borderColor: '#2E2E2E',
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#606060', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
                      YOUR INVITE CODE
                    </Text>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      backgroundColor: invitesLeft > 0 ? '#22C55E20' : '#EF444420',
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
                    }}>
                      <Ionicons name="ticket-outline" size={13} color={invitesLeft > 0 ? '#22C55E' : '#EF4444'} />
                      <Text style={{ color: invitesLeft > 0 ? '#22C55E' : '#EF4444', fontSize: 12, fontWeight: '700' }}>
                        {invitesLeft} of {totalInvites} left
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
                    <View style={{
                      backgroundColor: '#0A0A0A', borderRadius: 16, paddingVertical: 20,
                      alignItems: 'center', borderWidth: 1, borderColor: '#2E2E2E',
                      borderStyle: 'dashed',
                    }}>
                      <Text style={{ color: '#FAFAFA', fontSize: 32, fontWeight: '900', letterSpacing: 6 }}>
                        {code}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                        <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={14} color={copied ? '#22C55E' : '#606060'} />
                        <Text style={{ color: copied ? '#22C55E' : '#606060', fontSize: 13, fontWeight: '600' }}>
                          {copied ? 'Copied!' : 'Tap to copy'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleShare}
                    disabled={invitesLeft === 0}
                    style={{
                      backgroundColor: invitesLeft > 0 ? '#FF6B35' : '#252525',
                      height: 54, borderRadius: 27,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <Ionicons name="share-social" size={20} color={invitesLeft > 0 ? '#fff' : '#424242'} />
                    <Text style={{ color: invitesLeft > 0 ? '#fff' : '#424242', fontWeight: '800', fontSize: 16 }}>
                      {invitesLeft > 0 ? 'Share invite' : 'No invites left'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* People you brought in */}
              {referrals.length > 0 && (
                <Animated.View entering={FadeInDown.delay(200).springify()} style={{ gap: 14 }}>
                  <Text style={{ color: '#FAFAFA', fontSize: 17, fontWeight: '800' }}>
                    In because of you ({referrals.length})
                  </Text>
                  <View style={{ gap: 8 }}>
                    {referrals.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => router.push(`/user/${r.id}`)}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 12,
                          backgroundColor: '#1E1E1E', borderRadius: 16, padding: 12,
                          borderWidth: 1, borderColor: '#2E2E2E',
                        }}
                      >
                        <Avatar uri={r.avatar_url} name={r.display_name || r.username} size={42} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 15 }}>
                            {r.display_name || r.username}
                          </Text>
                          <Text style={{ color: '#606060', fontSize: 12 }}>
                            joined {formatRelativeTime(r.joined_at)}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 16 }}>🔥</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              )}

              <Text style={{ color: '#424242', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                Every person you bring in gets their own {totalInvites} invites.{'\n'}
                That's how the club grows — one real connection at a time.
              </Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
