import { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useFocusEffect } from 'expo-router'
import { initializeWallet, getDirector } from '@/lib/wallet'

export default function SecurityTab() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [loading, setLoading] = useState(false)
  const [mnemonic, setMnemonic] = useState<string[]>([])

  // Re-check mnemonic every time this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      initSecurity()
    }, []),
  )

  const initSecurity = async () => {
    try {
      setLoading(true)
      await initializeWallet()

      const dir = getDirector()
      if (dir) {
        try {
          const existingWords = await dir.getMnemonic()
          if (existingWords && existingWords.length > 0) {
            setMnemonic(existingWords)
          }
        } catch (e) {
          // No mnemonic yet
        }
      }
    } catch (error: any) {
      console.error('Init error:', error)
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMnemonic = async () => {
    const dir = getDirector()
    if (!dir) {
      Alert.alert('Error', 'Not initialized')
      return
    }
    try {
      setLoading(true)
      const words = await dir.generateMnemonic()
      setMnemonic(words)
      Alert.alert(
        'Recovery Phrase Generated',
        'Please write down these words and keep them safe. You can now go to the Federation tab to join a federation.',
      )
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyMnemonic = async () => {
    await Clipboard.setStringAsync(mnemonic.join(' '))
    Alert.alert('Copied!', 'Recovery phrase copied to clipboard')
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
            🔑 Recovery Phrase
          </Text>
          {mnemonic.length === 0 ? (
            <>
              <Text
                style={[
                  styles.welcomeText,
                  { color: isDark ? '#999' : '#666' },
                ]}
              >
                Generate a BIP39 mnemonic to secure your wallet. This is the
                master key for all your funds.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleGenerateMnemonic}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Generating...' : '✨ Generate Recovery Phrase'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.warning,
                  {
                    backgroundColor: isDark ? '#3d2f00' : '#fff3cd',
                    borderLeftColor: isDark ? '#ffc107' : '#ffc107',
                    color: isDark ? '#ffd54f' : '#856404',
                  },
                ]}
              >
                ⚠️ Write down these words in order. Keep them safe!
              </Text>
              <View
                style={[
                  styles.mnemonicContainer,
                  {
                    backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
                    borderColor: isDark ? '#6200ee' : '#6200ee',
                  },
                ]}
              >
                {mnemonic.map((word, index) => (
                  <View
                    key={index}
                    style={[
                      styles.wordContainer,
                      {
                        backgroundColor: isDark ? '#1a1a1a' : '#fff',
                      },
                    ]}
                  >
                    <Text style={styles.wordNumber}>{index + 1}.</Text>
                    <Text
                      style={[styles.word, { color: isDark ? '#fff' : '#333' }]}
                    >
                      {word}
                    </Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.copyButton,
                  {
                    backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
                    borderColor: isDark ? '#444' : '#ddd',
                  },
                ]}
                onPress={handleCopyMnemonic}
              >
                <Text style={styles.copyButtonText}>📋 Copy to Clipboard</Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: isDark ? '#0d1b2a' : '#e3f2fd',
                    borderLeftColor: isDark ? '#2196f3' : '#2196f3',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.infoText,
                    { color: isDark ? '#64b5f6' : '#1565c0' },
                  ]}
                >
                  ✅ Recovery phrase saved! Go to the Federation tab to join a
                  federation.
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
  warning: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  mnemonicContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
  },
  wordContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
  },
  wordNumber: { fontSize: 14, fontWeight: '600', color: '#6200ee', width: 30 },
  word: { fontSize: 16, fontWeight: '500' },
  primaryButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.6 },
  copyButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  copyButtonText: { color: '#6200ee', fontWeight: '600' },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
  },
  infoText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
})
