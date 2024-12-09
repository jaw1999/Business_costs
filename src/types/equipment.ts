export type EquipmentCategory = 'platform' | 'payload' | 'sensor'
export type DegradationType = 'cycles' | 'hours' | 'time'

export interface Consumable {
  id: string
  name: string
  unit: string
  costPerUnit: number
  stockLevel: number
  minimumStock: number
  reorderPoint: number
}

export interface DegradationParams {
  type: DegradationType
  maxValue: number
  currentValue: number
  replacementCost: number
  degradationRate: number  // Per use/hour/day depending on type
  lastUpdated: string
}

export interface Equipment {
  id: string
  category: EquipmentCategory
  name: string
  description: string
  manufacturer: string
  modelNumber: string
  acquisitionCost: number
  quantity: number
  inUse: number
  consumables: {
    id: string
    unitsPerUse: number
  }[]
  degradation: DegradationParams
  personnelRequired: number
  dateAdded: string
  lastUsed?: string
  specifications: Record<string, string | number>
  documents: {
    id: string
    type: 'manual' | 'specification' | 'certification'
    url: string
  }[]
}

export interface EquipmentCombination {
  id: string
  name: string
  description: string
  equipment: {
    id: string
    quantity: number
  }[]
  totalCost: number
  personnelRequired: number
  consumablesRequired: {
    id: string
    quantity: number
  }[]
  created: string
  lastUsed?: string
  usageCount: number
}