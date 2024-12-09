import { create } from 'zustand'
import type { 
  InventoryTransaction, 
  ConsumableTransaction,
  ProcurementNeed 
} from '@/types/inventory'
import type { Consumable } from '@/types/equipment'
import { InventoryManagerService } from '@/services/inventoryManager'
import { useEquipmentStore } from './equipmentStore'

interface InventoryState {
  consumables: Consumable[]
  transactions: (InventoryTransaction | ConsumableTransaction)[]
  procurementNeeds: ProcurementNeed[]
  selectedTransaction: (InventoryTransaction | ConsumableTransaction) | null
  loading: boolean
  error: string | null

  // Consumable Actions
  addConsumable: (consumable: Consumable) => void
  updateConsumable: (consumable: Consumable) => void
  removeConsumable: (id: string) => void
  updateStock: (id: string, quantity: number, type: 'increment' | 'decrement') => void
  
  // Transaction Actions
  addTransaction: (transaction: InventoryTransaction | ConsumableTransaction) => void
  updateTransaction: (transaction: InventoryTransaction | ConsumableTransaction) => void
  removeTransaction: (id: string) => void
  selectTransaction: (id: string | null) => void
  processTransaction: (transaction: InventoryTransaction | ConsumableTransaction) => Promise<boolean>
  
  // Procurement Actions
  addProcurementNeed: (need: ProcurementNeed) => void
  updateProcurementNeed: (need: ProcurementNeed) => void
  removeProcurementNeed: (id: string) => void
  fulfillProcurement: (id: string) => void
  generateProcurementNeeds: () => void
  
  // Bulk Actions
  importConsumables: (consumables: Consumable[]) => void
  syncInventory: () => void
  
  // Utility Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Queries
  getConsumableStock: (id: string) => number
  getLowStockConsumables: () => Consumable[]
  getTransactionHistory: (itemId: string) => (InventoryTransaction | ConsumableTransaction)[]
  getPendingProcurement: () => ProcurementNeed[]
  getConsumableAnalytics: (id: string) => {
    averageUsage: number
    projectedDepletion: Date
    reorderSuggestion: number
  }
}

const inventoryManager = InventoryManagerService.getInstance()

export const useInventoryStore = create<InventoryState>((set, get) => ({
  consumables: [],
  transactions: [],
  procurementNeeds: [],
  selectedTransaction: null,
  loading: false,
  error: null,

  // Consumable Actions
  addConsumable: (consumable) => {
    try {
      set((state) => ({
        consumables: [...state.consumables, consumable],
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to add consumable' })
    }
  },

  updateConsumable: (updatedConsumable) => {
    try {
      set((state) => ({
        consumables: state.consumables.map((c) =>
          c.id === updatedConsumable.id ? updatedConsumable : c
        ),
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to update consumable' })
    }
  },

  removeConsumable: (id) => {
    try {
      set((state) => ({
        consumables: state.consumables.filter((c) => c.id !== id),
        procurementNeeds: state.procurementNeeds.filter(
          (need) => need.itemId !== id
        ),
        transactions: state.transactions.filter(
          (t) => 'consumableId' in t && t.consumableId !== id
        ),
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to remove consumable' })
    }
  },

  updateStock: (id, quantity, type) => {
    try {
      set((state) => {
        const consumable = state.consumables.find((c) => c.id === id)
        if (!consumable) throw new Error('Consumable not found')

        const newStock = type === 'increment' 
          ? consumable.stockLevel + quantity
          : consumable.stockLevel - quantity

        if (newStock < 0) throw new Error('Insufficient stock')

        const updatedConsumable = {
          ...consumable,
          stockLevel: newStock
        }

        // Create transaction record
        const transaction: ConsumableTransaction = {
          id: crypto.randomUUID(),
          consumableId: id,
          type: type === 'increment' ? 'purchase' : 'use',
          quantity,
          date: new Date().toISOString()
        }

        return {
          consumables: state.consumables.map((c) =>
            c.id === id ? updatedConsumable : c
          ),
          transactions: [...state.transactions, transaction],
          error: null
        }
      })

      // Check if we need to generate new procurement needs
      get().generateProcurementNeeds()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update stock' })
    }
  },

  // Transaction Actions
  addTransaction: async (transaction) => {
    try {
      set({ loading: true })
      const success = await get().processTransaction(transaction)
      if (success) {
        set((state) => ({
          transactions: [...state.transactions, transaction],
          error: null
        }))
      }
    } catch (error) {
      set({ error: 'Failed to add transaction' })
    } finally {
      set({ loading: false })
    }
  },

  updateTransaction: (updatedTransaction) => {
    try {
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === updatedTransaction.id ? updatedTransaction : t
        ),
        selectedTransaction:
          state.selectedTransaction?.id === updatedTransaction.id
            ? updatedTransaction
            : state.selectedTransaction,
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to update transaction' })
    }
  },

  removeTransaction: (id) => {
    try {
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        selectedTransaction:
          state.selectedTransaction?.id === id ? null : state.selectedTransaction,
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to remove transaction' })
    }
  },

  selectTransaction: (id) => {
    set((state) => ({
      selectedTransaction: id
        ? state.transactions.find((t) => t.id === id) || null
        : null
    }))
  },

  processTransaction: async (transaction) => {
    try {
      const equipment = useEquipmentStore.getState().equipment
      const state = get()
      
      if ('consumableId' in transaction) {
        const result = await inventoryManager.processConsumableTransaction(
          transaction,
          state.consumables
        )
        
        if (result.success && result.updatedConsumable) {
          get().updateConsumable(result.updatedConsumable)
          return true
        }
      } else {
        const result = await inventoryManager.processEquipmentTransaction(
          transaction,
          equipment
        )
        
        if (result.success && result.updatedEquipment) {
          useEquipmentStore.getState().updateEquipment(result.updatedEquipment)
          return true
        }
      }
      
      return false
    } catch (error) {
      set({ error: 'Failed to process transaction' })
      return false
    }
  },

  // Procurement Actions
  addProcurementNeed: (need) => {
    try {
      set((state) => ({
        procurementNeeds: [...state.procurementNeeds, need],
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to add procurement need' })
    }
  },

  updateProcurementNeed: (updatedNeed) => {
    try {
      set((state) => ({
        procurementNeeds: state.procurementNeeds.map((n) =>
          n.id === updatedNeed.id ? updatedNeed : n
        ),
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to update procurement need' })
    }
  },

  removeProcurementNeed: (id) => {
    try {
      set((state) => ({
        procurementNeeds: state.procurementNeeds.filter((n) => n.id !== id),
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to remove procurement need' })
    }
  },

  fulfillProcurement: (id) => {
    try {
      const state = get()
      const need = state.procurementNeeds.find((n) => n.id === id)
      if (!need) throw new Error('Procurement need not found')

      if (need.itemType === 'consumable') {
        get().updateStock(need.itemId, need.quantity, 'increment')
      }

      set((state) => ({
        procurementNeeds: state.procurementNeeds.map((n) =>
          n.id === id ? { ...n, status: 'received' } : n
        ),
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to fulfill procurement' })
    }
  },

  generateProcurementNeeds: () => {
    try {
      const equipment = useEquipmentStore.getState().equipment
      const needs = inventoryManager.generateProcurementNeeds(
        equipment,
        get().consumables
      )
      
      set({ procurementNeeds: needs, error: null })
    } catch (error) {
      set({ error: 'Failed to generate procurement needs' })
    }
  },

  // Bulk Actions
  importConsumables: (consumables) => {
    try {
      set((state) => ({
        consumables: [...state.consumables, ...consumables],
        error: null
      }))
      get().generateProcurementNeeds()
    } catch (error) {
      set({ error: 'Failed to import consumables' })
    }
  },

  syncInventory: () => {
    try {
      const equipment = useEquipmentStore.getState().equipment
      const report = inventoryManager.generateInventoryReport(
        equipment,
        get().consumables
      )
      
      set((state) => ({
        consumables: report.consumables.map((c) => c.consumable),
        error: null
      }))
      
      get().generateProcurementNeeds()
    } catch (error) {
      set({ error: 'Failed to sync inventory' })
    }
  },

  // Utility Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Queries
  getConsumableStock: (id) => {
    const consumable = get().consumables.find((c) => c.id === id)
    return consumable?.stockLevel || 0
  },

  getLowStockConsumables: () => {
    return get().consumables.filter(
      (c) => c.stockLevel <= c.minimumStock
    )
  },

  getTransactionHistory: (itemId) => {
    return get().transactions.filter((t) => 
      ('consumableId' in t && t.consumableId === itemId) ||
      ('equipmentId' in t && t.equipmentId === itemId)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  getPendingProcurement: () => {
    return get().procurementNeeds.filter(
      (n) => n.status === 'pending' || n.status === 'approved'
    )
  },

  getConsumableAnalytics: (id) => {
    const consumable = get().consumables.find((c) => c.id === id)
    if (!consumable) {
      return {
        averageUsage: 0,
        projectedDepletion: new Date(),
        reorderSuggestion: 0
      }
    }

    const transactions = get()
      .getTransactionHistory(id)
      .filter((t): t is ConsumableTransaction => 'consumableId' in t)
    
    // Calculate average daily usage over the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentUsage = transactions
      .filter(t => 
        t.type === 'use' && 
        new Date(t.date) > thirtyDaysAgo
      )
      .reduce((total, t) => total + t.quantity, 0)
    
    const averageUsage = recentUsage / 30
    const daysUntilDepletion = averageUsage > 0 
      ? Math.floor(consumable.stockLevel / averageUsage)
      : Infinity
    
    const projectedDepletion = new Date()
    projectedDepletion.setDate(projectedDepletion.getDate() + daysUntilDepletion)

    // Suggest reorder quantity based on usage pattern and minimum stock
    const reorderSuggestion = Math.max(
      consumable.reorderPoint * 2,
      Math.ceil(averageUsage * 30)
    )

    return {
      averageUsage,
      projectedDepletion,
      reorderSuggestion
    }
  }
}))

// Selectors for common queries
export const useConsumables = () => useInventoryStore((state) => state.consumables)
export const useTransactions = () => useInventoryStore((state) => state.transactions)
export const useProcurementNeeds = () => useInventoryStore((state) => state.procurementNeeds)
export const useSelectedTransaction = () => useInventoryStore((state) => state.selectedTransaction)
export const useInventoryLoading = () => useInventoryStore((state) => state.loading)
export const useInventoryError = () => useInventoryStore((state) => state.error)