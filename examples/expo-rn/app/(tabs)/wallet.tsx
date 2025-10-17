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
  Modal,
  useColorScheme,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useFocusEffect } from 'expo-router'
import {
  initializeWallet,
  createWallet,
  getWallet,
  getDirector,
} from '@/lib/wallet'

export default function WalletTab() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [initializing, setInitializing] = useState(true)
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [joined, setJoined] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  // Receive modal state
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDescription, setInvoiceDescription] = useState('')
  const [generatedInvoice, setGeneratedInvoice] = useState('')

  // Send modal state
  const [payInvoice, setPayInvoice] = useState('')

  // Re-initialize and check status every time this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      initWallet()
    }, []),
  )

  const initWallet = async () => {
    try {
      setLoading(true)
      await initializeWallet()
      await checkJoinedStatus()
    } catch (error: any) {
      console.error('Init error:', error)
    } finally {
      setLoading(false)
      setInitializing(false)
    }
  }

  const checkJoinedStatus = async () => {
    try {
      const walletInstance = await createWallet()

      // Check if wallet is already open
      const isOpen = walletInstance.isOpen()
      console.log('Wallet isOpen():', isOpen)

      if (isOpen) {
        console.log('✓ Wallet is already open, setting joined=true')
        setJoined(true)
        // Only refresh balance if we just detected join
        if (!joined) {
          console.log('First time detecting join, refreshing balance')
          await refreshBalance()
        }
        return
      }

      // Try to open it
      try {
        console.log('Attempting to open wallet...')
        await walletInstance.open()
        console.log('✓ Wallet opened successfully, setting joined=true')
        setJoined(true)
        if (!joined) {
          await refreshBalance()
        }
      } catch (openError: any) {
        console.log('Wallet not joined yet:', openError.message)
        setJoined(false)
      }
    } catch (e: any) {
      console.log('Wallet check error:', e.message)
      setJoined(false)
    }
  }

  const refreshBalance = async () => {
    const wallet = getWallet()
    if (!wallet) {
      setBalance(null)
      return
    }
    try {
      setLoading(true)
      const bal = await wallet.balance.getBalance()
      setBalance(bal)
    } catch (e: any) {
      console.error('Balance error:', e)
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvoice = async () => {
    const wallet = getWallet()
    if (!wallet) {
      Alert.alert('Error', 'Please join a federation first')
      return
    }
    const amount = parseInt(invoiceAmount, 10)
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Enter a valid amount (sats)')
      return
    }
    try {
      setLoading(true)
      // Convert sats to msats
      const amountMsats = amount * 1000
      const res = await wallet.lightning.createInvoice(
        amountMsats,
        invoiceDescription || 'Payment',
      )
      setGeneratedInvoice(res.invoice)
      Alert.alert('Invoice Created', 'Ready to share')
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInvoice = async () => {
    if (!generatedInvoice) return
    await Clipboard.setStringAsync(generatedInvoice)
    Alert.alert('Copied', 'Lightning invoice copied to clipboard')
  }

  const handlePayInvoice = async () => {
    const wallet = getWallet()
    if (!wallet) {
      Alert.alert('Error', 'Please join a federation first')
      return
    }
    if (!payInvoice.trim()) {
      Alert.alert('Error', 'Paste a lightning invoice to pay')
      return
    }
    try {
      setLoading(true)
      await wallet.lightning.payInvoice(payInvoice)
      setPayInvoice('')
      setShowSendModal(false)
      await refreshBalance()
      Alert.alert('Success', 'Invoice paid')
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to pay invoice')
    } finally {
      setLoading(false)
    }
  }

  const closeReceiveModal = () => {
    setShowReceiveModal(false)
    setInvoiceAmount('')
    setInvoiceDescription('')
    setGeneratedInvoice('')
  }

  const closeSendModal = () => {
    setShowSendModal(false)
    setPayInvoice('')
  }

  if (initializing) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? '#000' : '#fff' },
          styles.centerContent,
        ]}
      >
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={[styles.loadingText, { color: isDark ? '#999' : '#666' }]}>
          Initializing wallet...
        </Text>
      </View>
    )
  }

  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}
    >
      <View style={styles.centerContainer}>
        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <Text
              style={[styles.balanceValue, { color: isDark ? '#fff' : '#000' }]}
            >
              {balance !== null ? `${Math.floor(balance / 1000)}` : '—'}
            </Text>
            <Text
              style={[styles.balanceUnit, { color: isDark ? '#999' : '#666' }]}
            >
              SATS
            </Text>
          </View>
        </View>

        {joined ? (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowReceiveModal(true)}
            >
              <Text style={styles.actionButtonText}>Receive</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSendModal(true)}
            >
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.infoBox,
              { backgroundColor: isDark ? '#1a1a1a' : '#e3f2fd' },
            ]}
          >
            <Text
              style={[
                styles.infoText,
                { color: isDark ? '#64b5f6' : '#1565c0' },
              ]}
            >
              Join a federation in the Federation tab to start using your wallet
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshBalance}
          disabled={loading}
        >
          <Text
            style={[
              styles.refreshButtonText,
              { color: loading ? (isDark ? '#555' : '#ccc') : '#6200ee' },
            ]}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Receive Modal */}
      <Modal
        visible={showReceiveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeReceiveModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1a1a1a' : '#fff' },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: isDark ? '#fff' : '#333' }]}
            >
              ⚡ Receive Lightning
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
              placeholder="Amount (sats)"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="numeric"
              value={invoiceAmount}
              onChangeText={setInvoiceAmount}
              editable={!loading}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#fafafa',
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#ddd',
                },
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={invoiceDescription}
              onChangeText={setInvoiceDescription}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateInvoice}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creating...' : 'Create Invoice'}
              </Text>
            </TouchableOpacity>

            {generatedInvoice ? (
              <View
                style={[
                  styles.invoiceBox,
                  {
                    backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
                    borderColor: isDark ? '#444' : '#ddd',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.invoiceLabel,
                    { color: isDark ? '#999' : '#666' },
                  ]}
                >
                  Generated Invoice
                </Text>
                <Text
                  style={[
                    styles.invoiceText,
                    { color: isDark ? '#fff' : '#333' },
                  ]}
                  numberOfLines={4}
                >
                  {generatedInvoice}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.copyButton,
                    {
                      backgroundColor: isDark ? '#333' : '#f0f0f0',
                      borderColor: isDark ? '#555' : '#ddd',
                    },
                  ]}
                  onPress={handleCopyInvoice}
                >
                  <Text style={styles.copyButtonText}>Copy Invoice</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
                },
              ]}
              onPress={closeReceiveModal}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  { color: isDark ? '#999' : '#666' },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Send Modal */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeSendModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1a1a1a' : '#fff' },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: isDark ? '#fff' : '#333' }]}
            >
              ⚡ Send Lightning
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#fafafa',
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#ddd',
                },
              ]}
              placeholder="Paste lightning invoice"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={payInvoice}
              onChangeText={setPayInvoice}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePayInvoice}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Paying...' : 'Pay Invoice'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
                },
              ]}
              onPress={closeSendModal}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  { color: isDark ? '#999' : '#666' },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceValue: { fontSize: 56, fontWeight: '300' },
  balanceUnit: { fontSize: 18, fontWeight: '500', letterSpacing: 1 },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  refreshButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refreshButtonText: { fontSize: 14, fontWeight: '500' },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoText: { fontSize: 14, color: '#1565c0', lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  primaryButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  invoiceBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  invoiceLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  invoiceText: { fontSize: 12, color: '#333', marginBottom: 8 },
  copyButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  copyButtonText: { color: '#6200ee', fontWeight: '600' },
  closeButton: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
})
