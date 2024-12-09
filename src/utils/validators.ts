import type { 
    Equipment, 
    EquipmentCombination, 
    Consumable,
    DegradationParams 
  } from '@/types/equipment'
  import type { 
    InventoryTransaction, 
    ConsumableTransaction,
    ProcurementNeed 
  } from '@/types/inventory'
  
  export interface ValidationResult {
    isValid: boolean
    errors: string[]
  }
  
  export const validateEquipment = (equipment: Partial<Equipment>): ValidationResult => {
    const errors: string[] = []
  
    if (!equipment.name?.trim()) {
      errors.push('Equipment name is required')
    }
  
    if (!equipment.category) {
      errors.push('Equipment category is required')
    }
  
    if (equipment.acquisitionCost !== undefined && equipment.acquisitionCost < 0) {
      errors.push('Acquisition cost cannot be negative')
    }
  
    if (equipment.quantity !== undefined && equipment.quantity < 0) {
      errors.push('Quantity cannot be negative')
    }
  
    if (equipment.inUse !== undefined) {
      if (equipment.inUse < 0) {
        errors.push('In-use count cannot be negative')
      }
      if (equipment.quantity !== undefined && equipment.inUse > equipment.quantity) {
        errors.push('In-use count cannot exceed total quantity')
      }
    }
  
    if (equipment.personnelRequired !== undefined && equipment.personnelRequired < 0) {
      errors.push('Personnel required cannot be negative')
    }
  
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  export const validateDegradation = (params: Partial<DegradationParams>): ValidationResult => {
    const errors: string[] = []
  
    if (!params.type) {
      errors.push('Degradation type is required')
    }
  
    if (params.maxValue !== undefined && params.maxValue <= 0) {
      errors.push('Maximum value must be greater than zero')
    }
  
    if (params.currentValue !== undefined) {
      if (params.currentValue < 0) {
        errors.push('Current value cannot be negative')
      }
      if (params.maxValue !== undefined && params.currentValue > params.maxValue) {
        errors.push('Current value cannot exceed maximum value')
      }
    }
  
    if (params.degradationRate !== undefined && params.degradationRate <= 0) {
      errors.push('Degradation rate must be greater than zero')
    }
  
    try {
      if (params.lastUpdated) {
        new Date(params.lastUpdated)
      }
    } catch {
      errors.push('Last updated date is invalid')
    }
  
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  export const validateConsumable = (consumable: Partial<Consumable>): ValidationResult => {
    const errors: string[] = []
  
    if (!consumable.name?.trim()) {
      errors.push('Consumable name is required')
    }
  
    if (!consumable.unit?.trim()) {
      errors.push('Unit of measurement is required')
    }
  
    if (consumable.costPerUnit !== undefined && consumable.costPerUnit < 0) {
      errors.push('Cost per unit cannot be negative')
    }
  
    if (consumable.stockLevel !== undefined && consumable.stockLevel < 0) {
      errors.push('Stock level cannot be negative')
    }
  
    if (consumable.minimumStock !== undefined && consumable.minimumStock < 0) {
      errors.push('Minimum stock cannot be negative')
    }
  
    if (consumable.reorderPoint !== undefined) {
      if (consumable.reorderPoint < 0) {
        errors.push('Reorder point cannot be negative')
      }
      if (consumable.minimumStock !== undefined && 
          consumable.reorderPoint < consumable.minimumStock) {
        errors.push('Reorder point must be greater than or equal to minimum stock')
      }
    }
  
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  export const validateTransaction = (
    transaction: Partial<InventoryTransaction | ConsumableTransaction>
  ): ValidationResult => {
    const errors: string[] = []
  
    if ('equipmentId' in transaction) {
      if (!transaction.equipmentId) {
        errors.push('Equipment ID is required')
      }
    } else if ('consumableId' in transaction) {
      if (!transaction.consumableId) {
        errors.push('Consumable ID is required')
      }
    } else {
      errors.push('Invalid transaction type')
    }
  
    if (!transaction.type) {
      errors.push('Transaction type is required')
    }
  
    if (transaction.quantity === undefined || transaction.quantity <= 0) {
      errors.push('Quantity must be greater than zero')
    }
  
    try {
      if (transaction.date) {
        new Date(transaction.date)
      }
    } catch {
      errors.push('Transaction date is invalid')
    }
  
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  export const validateCombination = (
    combination: Partial<EquipmentCombination>,
    availableEquipment: Equipment[]
  ): ValidationResult => {
    const errors: string[] = []
  
    if (!combination.name?.trim()) {
      errors.push('Combination name is required')
    }
  
    if (!combination.equipment?.length) {
      errors.push('Combination must include at least one piece of equipment')
    } else {
      combination.equipment.forEach((item, index) => {
        const equipment = availableEquipment.find(e => e.id === item.id)
        if (!equipment) {
          errors.push(`Equipment at index ${index} not found`)
          return
        }
  
        if (item.quantity <= 0) {
          errors.push(`Quantity for ${equipment.name} must be greater than zero`)
        }
  
        if (item.quantity > equipment.quantity) {
          errors.push(`Insufficient quantity available for ${equipment.name}`)
        }
      })
    }
  
    if (combination.personnelRequired !== undefined && combination.personnelRequired < 0) {
      errors.push('Personnel required cannot be negative')
    }
  
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  export const validateProcurementNeed = (need: Partial<ProcurementNeed>): ValidationResult => {
    const errors: string[] = []
  
    if (!need.itemType) {
      errors.push('Item type is required')
    }
  
    if (!need.itemId) {
      errors.push('Item ID is required')
    }
  
    if (need.quantity === undefined || need.quantity <= 0) {
      errors.push('Quantity must be greater than zero')
    }
  
    if (need.estimatedCost !== undefined && need.estimatedCost < 0) {
      errors.push('Estimated cost cannot be negative')
    }
  
    if (!need.priority) {
      errors.push('Priority level is required')
    }
  
    if (!need.reason?.trim()) {
      errors.push('Reason for procurement is required')
    }
  
    try {
      if (need.requestDate) {
        new Date(need.requestDate)
      }
    } catch {
      errors.push('Request date is invalid')
    }
  
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  // Helper validation functions
  export const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }
  
  export const isValidQuantity = (quantity: number): boolean => {
    return Number.isInteger(quantity) && quantity >= 0
  }
  
  export const isValidCost = (cost: number): boolean => {
    return !isNaN(cost) && cost >= 0
  }
  
  export const isValidPercentage = (value: number): boolean => {
    return !isNaN(value) && value >= 0 && value <= 100
  }
  
  export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  // File validation
  export const validatePDFFile = (file: File): ValidationResult => {
    const errors: string[] = []
  
    if (file.type !== 'application/pdf') {
      errors.push('File must be a PDF')
    }
  
    // 10MB max size
    if (file.size > 10 * 1024 * 1024) {
      errors.push('File size must be less than 10MB')
    }
  
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  export const validateCSVFile = (file: File): ValidationResult => {
    const errors: string[] = []
  
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      errors.push('File must be a CSV')
    }
  
    // 5MB max size
    if (file.size > 5 * 1024 * 1024) {
      errors.push('File size must be less than 5MB')
    }
  
    return {
      isValid: errors.length === 0,
      errors
    }
  }