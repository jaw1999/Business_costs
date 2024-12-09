import type { Equipment, Consumable } from './equipment'

export interface InventoryTransaction {
  id: string
  equipmentId: string
  type: 'acquisition' | 'deployment' | 'return' | 'disposal'
  quantity: number
  date: string
  notes: string
  cost?: number
  personnelId?: string
}

export interface ConsumableTransaction {
  id: string
  consumableId: string
  type: 'purchase' | 'use' | 'disposal'
  quantity: number
  date: string
  cost?: number
  associatedEquipmentId?: string
}

export interface InventoryReport {
  date: string
  equipment: {
    equipment: Equipment
    available: number
    deployed: number
    maintenance: number
    degradationStatus: number  // Percentage of life remaining
  }[]
  consumables: {
    consumable: Consumable
    currentStock: number
    pendingOrders: number
    projectedUsage: number
  }[]
  alerts: {
    type: 'low_stock' | 'maintenance_needed' | 'replacement_needed'
    severity: 'high' | 'medium' | 'low'
    message: string
    itemId: string
  }[]
}

export interface ProcurementNeed {
  id: string
  itemType: 'equipment' | 'consumable'
  itemId: string
  quantity: number
  estimatedCost: number
  priority: 'high' | 'medium' | 'low'
  reason: string
  requestDate: string
  status: 'pending' | 'approved' | 'ordered' | 'received'
}