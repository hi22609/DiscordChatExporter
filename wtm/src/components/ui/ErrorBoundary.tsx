import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { log } from '@/lib/log';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; }

/**
 * Last-resort crash screen. A render error anywhere below shows a branded
 * recovery screen instead of a white screen of death.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    log.error('crash', error.message, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={{
        flex: 1, backgroundColor: '#0A0A0A',
        alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32,
      }}>
        <Text style={{ fontSize: 44 }}>😵</Text>
        <Text style={{ color: '#FAFAFA', fontSize: 20, fontWeight: '800' }}>
          That wasn't the move
        </Text>
        <Text style={{ color: '#A0A0A0', fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
          Something broke on our end. Tap below to get back to the map.
        </Text>
        <TouchableOpacity
          onPress={() => this.setState({ hasError: false })}
          style={{
            backgroundColor: '#FF6B35', paddingHorizontal: 24, height: 48,
            borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
