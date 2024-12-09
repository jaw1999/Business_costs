import { create } from 'zustand'
import type { Equipment, EquipmentCombination } from '@/types/equipment'
import { DegradationTrackerService } from '@/services/degradationTracker'

interface EquipmentState {
  equipment: Equipment[]
  combinations: EquipmentCombination[]
  selectedEquipment: Equipment | null
  selectedCombination: EquipmentCombination | null
  loading: boolean
  error: string | null
  
  // Equipment Actions
  addEquipment: (equipment: Equipment) => void
  updateEquipment: (equipment: Equipment) => void
  removeEquipment: (id: string) => void
  selectEquipment: (id: string | null) => void
  
  // Combination Actions
  addCombination: (combination: EquipmentCombination) => void
  updateCombination: (combination: EquipmentCombination) => void
  removeCombination: (id: string) => void
  selectCombination: (id: string | null) => void
  
  // Bulk Actions
  importEquipment: (equipmentList: Equipment[]) => void
  updateDegradation: (usage: { cycles?: number; hours?: number; days?: number }) => void
  
  // Filtering and Sorting
  filterEquipmentByCategory: (category: string) => Equipment[]
  filterEquipmentByStatus: (status: 'available' | 'deployed' | 'maintenance') => Equipment[]
  searchEquipment: (query: string) => Equipment[]
  
  // Utility Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

const degradationTracker = DegradationTrackerService.getInstance()

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: [],
  combinations: [],
  selectedEquipment: null,
  selectedCombination: null,
  loading: false,
  error: null,

  // Equipment Actions
  addEquipment: (equipment) => {
    try {
      set((state) => ({
        equipment: [...state.equipment, equipment],
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to add equipment' })
    }
  },

  updateEquipment: (updatedEquipment) => {
    try {
      set((state) => ({
        equipment: state.equipment.map((eq) =>
          eq.id === updatedEquipment.id ? updatedEquipment : eq
        ),
        selectedEquipment:
          state.selectedEquipment?.id === updatedEquipment.id
            ? updatedEquipment
            : state.selectedEquipment,
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to update equipment' })
    }
  },

  removeEquipment: (id) => {
    try {
      set((state) => ({
        equipment: state.equipment.filter((eq) => eq.id !== id),
        selectedEquipment:
          state.selectedEquipment?.id === id ? null : state.selectedEquipment,
        combinations: state.combinations.map((combo) => ({
          ...combo,
          equipment: combo.equipment.filter((eq) => eq.id !== id)
        })),
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to remove equipment' })
    }
  },

  selectEquipment: (id) => {
    set((state) => ({
      selectedEquipment: id
        ? state.equipment.find((eq) => eq.id === id) || null
        : null
    }))
  },

  // Combination Actions
  addCombination: (combination) => {
    try {
      set((state) => ({
        combinations: [...state.combinations, combination],
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to add combination' })
    }
  },

  updateCombination: (updatedCombination) => {
    try {
      set((state) => ({
        combinations: state.combinations.map((combo) =>
          combo.id === updatedCombination.id ? updatedCombination : combo
        ),
        selectedCombination:
          state.selectedCombination?.id === updatedCombination.id
            ? updatedCombination
            : state.selectedCombination,
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to update combination' })
    }
  },

  removeCombination: (id) => {
    try {
      set((state) => ({
        combinations: state.combinations.filter((combo) => combo.id !== id),
        selectedCombination:
          state.selectedCombination?.id === id ? null : state.selectedCombination,
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to remove combination' })
    }
  },

  selectCombination: (id) => {
    set((state) => ({
      selectedCombination: id
        ? state.combinations.find((combo) => combo.id === id) || null
        : null
    }))
  },

  // Bulk Actions
  importEquipment: (equipmentList) => {
    try {
      set((state) => ({
        equipment: [...state.equipment, ...equipmentList],
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to import equipment' })
    }
  },

  updateDegradation: (usage) => {
    try {
      set((state) => ({
        equipment: state.equipment.map((eq) => ({
          ...eq,
          degradation: degradationTracker.calculateDegradation(eq, usage)
        })),
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to update degradation' })
    }
  },

  // Filtering and Sorting
  filterEquipmentByCategory: (category) => {
    const state = get()
    return category === 'all'
      ? state.equipment
      : state.equipment.filter((eq) => eq.category === category)
  },

  filterEquipmentByStatus: (status) => {
    const state = get()
    return state.equipment.filter((eq) => {
      const inUse = eq.inUse > 0
      const needsMaintenance = degradationTracker.getHealthStatus(eq).needsMaintenance
      
      switch (status) {
        case 'deployed':
          return inUse
        case 'maintenance':
          return needsMaintenance
        case 'available':
          return !inUse && !needsMaintenance
        default:
          return true
      }
    })
  },

  searchEquipment: (query) => {
    const state = get()
    const searchTerms = query.toLowerCase().split(' ')
    
    return state.equipment.filter((eq) => {
      const searchableText = `${eq.name} ${eq.description} ${eq.manufacturer} ${eq.modelNumber}`.toLowerCase()
      return searchTerms.every((term) => searchableText.includes(term))
    })
  },

  // Utility Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null })
}))

// Selectors
export const useSelectedEquipment = () => useEquipmentStore((state) => state.selectedEquipment)
export const useSelectedCombination = () => useEquipmentStore((state) => state.selectedCombination)
export const useEquipmentLoading = () => useEquipmentStore((state) => state.loading)
export const useEquipmentError = () => useEquipmentStore((state) => state.error)