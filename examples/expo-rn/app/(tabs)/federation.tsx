import { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import {
  initializeWallet,
  createWallet,
  getWallet,
  getDirector,
} from '@/lib/wallet'

export default function FederationTab() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [hasMnemonic, setHasMnemonic] = useState(false)

  useFocusEffect(
    useCallback(() => {
      checkStatus()
    }, []),
  )

  const checkStatus = async () => {
    try {
      setLoading(true)
      await initializeWallet()

      // Check if mnemonic exists
      const dir = getDirector()
      if (dir) {
        try {
          const existingWords = await dir.getMnemonic()
          setHasMnemonic(existingWords && existingWords.length > 0)

          // Check if already joined a federation
          if (existingWords && existingWords.length > 0) {
            try {
              const walletInstance = await createWallet()
              const opened = walletInstance.isOpen()
              setJoined(opened)
              if (!opened) {
                try {
                  await walletInstance.open()
                  setJoined(true)
                } catch (e) {
                  setJoined(false)
                }
              }
            } catch (e) {
              console.error('Wallet check error:', e)
              setJoined(false)
            }
          }
        } catch (e) {
          setHasMnemonic(false)
        }
      }
    } catch (error: any) {
      console.error('Check status error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinFederation = async () => {
    if (!hasMnemonic) {
      Alert.alert(
        'Error',
        'Please generate a recovery phrase in the Security tab first',
      )
      return
    }
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter a federation invite code')
      return
    }
    try {
      setLoading(true)
      const walletInstance = await createWallet()
      await walletInstance.joinFederation(inviteCode)
      setJoined(true)
      setInviteCode('')
      Alert.alert(
        'Success!',
        'Your wallet is now connected to the federation! Go to the Wallet tab.',
      )
    } catch (error: any) {
      console.error('Join error:', error)
      Alert.alert('Error', error.message || 'Failed to join federation')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchFederation = async () => {
    Alert.alert(
      'Switch Federation',
      'To switch federations, you need to delete and reinstall the app. This will clear all data.',
      [{ text: 'OK' }],
    )
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000' : '#f5f5f5' },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? '#1a1a1a' : '#fff' },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: isDark ? '#fff' : '#333' }]}
          >
            🌐 Federation
          </Text>

          {!hasMnemonic ? (
            <View
              style={[
                styles.warningBox,
                {
                  backgroundColor: isDark ? '#3d2f00' : '#fff3cd',
                  borderLeftColor: '#ffc107',
                },
              ]}
            >
              <Text
                style={[
                  styles.warningText,
                  { color: isDark ? '#ffd54f' : '#856404' },
                ]}
              >
                ⚠️ Please generate a recovery phrase in the Security tab first
              </Text>
            </View>
          ) : !joined ? (
            <>
              <Text
                style={[
                  styles.welcomeText,
                  { color: isDark ? '#999' : '#666' },
                ]}
              >
                Enter a federation invite code to connect your wallet to the
                network:
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2a2a2a' : '#fafafa',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd',
                  },
                ]}
                placeholder="Paste federation invite code"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={inviteCode}
                onChangeText={setInviteCode}
                multiline
                numberOfLines={4}
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleJoinFederation}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Joining...' : '🚀 Join Federation'}
                </Text>
              </TouchableOpacity>

              {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
            </>
          ) : (
            <>
              <View
                style={[
                  styles.successBox,
                  {
                    backgroundColor: isDark ? '#0d3818' : '#e8f5e9',
                    borderLeftColor: '#4caf50',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.successText,
                    { color: isDark ? '#66bb6a' : '#2e7d32' },
                  ]}
                >
                  ✅ Connected to Federation
                </Text>
                <Text
                  style={[
                    styles.infoText,
                    { color: isDark ? '#81c784' : '#2e7d32' },
                  ]}
                >
                  Your wallet is active and ready to use!
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
                    borderColor: isDark ? '#444' : '#ddd',
                  },
                ]}
                onPress={handleSwitchFederation}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: isDark ? '#999' : '#666' },
                  ]}
                >
                  Switch Federation
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: isDark ? '#0d1b2a' : '#e3f2fd',
                    borderLeftColor: '#2196f3',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.infoText,
                    { color: isDark ? '#64b5f6' : '#1565c0' },
                  ]}
                >
                  💡 To switch to a different federation, you'll need to delete
                  and reinstall the app
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  warningBox: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginVertical: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  successBox: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
  },
  infoText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
})
