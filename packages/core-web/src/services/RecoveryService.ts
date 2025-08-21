import type { JSONValue } from '../types'
import { RpcClient } from '../rpc'

export class RecoveryService {
  constructor(
    private client: RpcClient,
    private clientName: string,
  ) {}

  async hasPendingRecoveries() {
    return await this.client.rpcSingle<boolean>(
      '',
      'has_pending_recoveries',
      {},
      this.clientName,
    )
  }

  async waitForAllRecoveries() {
    await this.client.rpcSingle(
      '',
      'wait_for_all_recoveries',
      {},
      this.clientName,
    )
  }

  subscribeToRecoveryProgress(
    onSuccess: (progress: { module_id: number; progress: JSONValue }) => void,
    onError: (error: string) => void,
  ) {
    return this.client.rpcStream<{
      module_id: number
      progress: JSONValue
    }>(
      '',
      'subscribe_to_recovery_progress',
      {},
      onSuccess,
      onError,
      () => {},
      this.clientName,
    )
  }

  /**
   * Subscribes to recovery progress and returns the overall percentage based on the module with the lowest progress.
   *
   * This function tracks the progress of each module and calculates the overall percentage based on the
   * module with the lowest completion percentage. This provides a conservative estimate of the total recovery progress.
   *
   * @param onPercentageChange - Callback that receives the current percentage (0-100) whenever it changes
   * @param onModuleProgress - Optional callback that receives detailed progress for each module
   * @param onError - Callback that receives error messages if the subscription fails
   * @returns A function to unsubscribe from the recovery progress updates
   */
  subscribeToRecoveryProgressPercentage(
    onPercentageChange: (percentage: number) => void,
    onModuleProgress?: (
      moduleProgress: Map<
        number,
        { complete: number; total: number; percentage: number }
      >,
    ) => void,
    onError?: (error: string) => void,
  ): () => void {
    // Track the progress of each module
    const moduleProgressMap = new Map<
      number,
      { complete: number; total: number; percentage: number }
    >()
    let currentPercentage = 0

    // Helper to calculate the lowest percentage across all modules
    const calculateOverallPercentage = (): number => {
      if (moduleProgressMap.size === 0) return 0

      // Find the minimum percentage among all modules
      let minPercentage = 100
      moduleProgressMap.forEach((progress) => {
        minPercentage = Math.min(minPercentage, progress.percentage)
      })

      return minPercentage
    }

    // Subscribe to the raw progress events
    const unsubscribe = this.subscribeToRecoveryProgress(
      (data) => {
        try {
          const { module_id, progress } = data

          // Extract complete and total if available in the progress object
          if (
            typeof progress === 'object' &&
            progress !== null &&
            'complete' in progress &&
            'total' in progress &&
            typeof progress.complete === 'number' &&
            typeof progress.total === 'number'
          ) {
            const complete = progress.complete
            const total = progress.total

            // Handle special case: if both complete and total are 0, treat as 0% processed
            // This happens during initialization phase before actual recovery starts
            let percentage = 0
            if (total > 0) {
              percentage = Math.min(100, (complete / total) * 100)
            } else if (complete > 0) {
              // Edge case: somehow we have progress but no total
              percentage = 100
            } // Otherwise both are 0, keep percentage at 0

            // Update the progress for this module
            moduleProgressMap.set(module_id, { complete, total, percentage })

            // Calculate the new overall percentage
            const newPercentage = calculateOverallPercentage()

            // Only notify if the percentage has changed
            if (newPercentage !== currentPercentage) {
              currentPercentage = newPercentage
              onPercentageChange(currentPercentage)
            }

            // If detailed module progress is requested, provide it
            if (onModuleProgress) {
              onModuleProgress(new Map(moduleProgressMap))
            }
          }
        } catch (error) {
          console.error('Error processing recovery progress:', error)
        }
      },
      (error) => {
        if (onError) {
          onError(error)
        } else {
          console.error('Recovery progress subscription error:', error)
        }
      },
    )

    return unsubscribe
  }

  async backupToFederation(metadata: JSONValue) {
    return await this.client.rpcSingle(
      '',
      'backup_to_federation',
      { metadata },
      this.clientName,
    )
  }

  /**
   * Gets the current recovery percentage based on the module with the lowest progress.
   *
   * This is a one-time check of the current recovery status. For continuous updates,
   * use subscribeToRecoveryProgressPercentage instead.
   *
   * @returns A promise that resolves to the current recovery percentage (0-100)
   */
  async getCurrentRecoveryPercentage(): Promise<number> {
    // Get the current recovery status from the federation
    try {
      const recoveryStatus = await this.client.rpcSingle<{
        modules: Array<{
          module_id: number
          progress: { complete: number; total: number }
        }>
      }>('', 'get_recovery_status', {}, this.clientName)

      if (
        !recoveryStatus ||
        !recoveryStatus.modules ||
        recoveryStatus.modules.length === 0
      ) {
        // No active recovery or no data available
        return 0
      }

      // Calculate the percentage for each module
      const percentages = recoveryStatus.modules.map((module) => {
        const { complete, total } = module.progress

        // Handle special case: if both complete and total are 0, treat as 0% processed
        // Otherwise, calculate the percentage normally when total > 0
        if (complete === 0 && total === 0) {
          return 0 // Explicit handling of initialization state (0/0)
        } else if (total > 0) {
          return Math.min(100, (complete / total) * 100)
        } else if (complete > 0) {
          // Edge case: somehow we have progress but no total
          return 100
        } else {
          return 0
        }
      })

      // Return the minimum percentage (the module with the least progress)
      return Math.min(...percentages, 100)
    } catch (error) {
      console.error('Error getting recovery percentage:', error)
      throw error
    }
  }
}
