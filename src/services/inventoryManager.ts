import type { 
    Equipment, 
    Consumable,
    EquipmentCombination 
  } from '@/types/equipment'
  import type { 
    InventoryTransaction, 
    ConsumableTransaction,
    InventoryReport,
    ProcurementNeed 
  } from '@/types/inventory'
  import { DegradationTrackerService } from './degradationTracker'
  import { CostCalculatorService } from './costCalculator'
  
  interface InventoryStatus {
    available: number
    deployed: number
    maintenance: number
    degradationStatus: number
  }
  
  export class InventoryManagerService {
    private static instance: InventoryManagerService
    private degradationTracker: DegradationTrackerService
    private costCalculator: CostCalculatorService
  
    private constructor() {
      this.degradationTracker = DegradationTrackerService.getInstance()
      this.costCalculator = CostCalculatorService.getInstance()
    }
  
    public static getInstance(): InventoryManagerService {
      if (!InventoryManagerService.instance) {
        InventoryManagerService.instance = new InventoryManagerService()
      }
      return InventoryManagerService.instance
    }
  
    getInventoryStatus(equipment: Equipment): InventoryStatus {
      const degradation = this.degradationTracker.getHealthStatus(equipment)
      const inMaintenance = degradation.needsMaintenance ? 1 : 0
  
      return {
        available: equipment.quantity - equipment.inUse - inMaintenance,
        deployed: equipment.inUse,
        maintenance: inMaintenance,
        degradationStatus: (equipment.degradation.currentValue / equipment.degradation.maxValue) * 100
      }
    }
  
    processEquipmentTransaction(
      transaction: InventoryTransaction,
      equipment: Equipment[]
    ): {
      success: boolean
      message: string
      updatedEquipment?: Equipment
    } {
      const equipmentItem = equipment.find(e => e.id === transaction.equipmentId)
      if (!equipmentItem) {
        return {
          success: false,
          message: 'Equipment not found'
        }
      }
  
      const status = this.getInventoryStatus(equipmentItem)
      const updatedEquipment = { ...equipmentItem }
  
      switch (transaction.type) {
        case 'acquisition':
          updatedEquipment.quantity += transaction.quantity
          break
  
        case 'deployment':
          if (status.available < transaction.quantity) {
            return {
              success: false,
              message: 'Insufficient available equipment'
            }
          }
          updatedEquipment.inUse += transaction.quantity
          break
  
        case 'return':
          if (updatedEquipment.inUse < transaction.quantity) {
            return {
              success: false,
              message: 'Invalid return quantity'
            }
          }
          updatedEquipment.inUse -= transaction.quantity
          // Update degradation based on usage
          updatedEquipment.degradation = this.degradationTracker.calculateDegradation(
            updatedEquipment,
            { cycles: 1 }
          )
          break
  
        case 'disposal':
          if (updatedEquipment.quantity < transaction.quantity) {
            return {
              success: false,
              message: 'Invalid disposal quantity'
            }
          }
          updatedEquipment.quantity -= transaction.quantity
          break
      }
  
      return {
        success: true,
        message: 'Transaction processed successfully',
        updatedEquipment
      }
    }
  
    processConsumableTransaction(
      transaction: ConsumableTransaction,
      consumables: Consumable[]
    ): {
      success: boolean
      message: string
      updatedConsumable?: Consumable
    } {
      const consumable = consumables.find(c => c.id === transaction.consumableId)
      if (!consumable) {
        return {
          success: false,
          message: 'Consumable not found'
        }
      }
  
      const updatedConsumable = { ...consumable }
  
      switch (transaction.type) {
        case 'purchase':
          updatedConsumable.stockLevel += transaction.quantity
          break
  
        case 'use':
          if (updatedConsumable.stockLevel < transaction.quantity) {
            return {
              success: false,
              message: 'Insufficient stock'
            }
          }
          updatedConsumable.stockLevel -= transaction.quantity
          break
  
        case 'disposal':
          if (updatedConsumable.stockLevel < transaction.quantity) {
            return {
              success: false,
              message: 'Invalid disposal quantity'
            }
          }
          updatedConsumable.stockLevel -= transaction.quantity
          break
      }
  
      // Check if stock level is below reorder point
      if (updatedConsumable.stockLevel <= updatedConsumable.reorderPoint) {
        // Trigger reorder alert
        this.triggerReorder(updatedConsumable)
      }
  
      return {
        success: true,
        message: 'Transaction processed successfully',
        updatedConsumable
      }
    }
  
    generateInventoryReport(
      equipment: Equipment[],
      consumables: Consumable[]
    ): InventoryReport {
      const alerts: InventoryReport['alerts'] = []
      const equipmentStatus = equipment.map(eq => {
        const status = this.getInventoryStatus(eq)
        const healthStatus = this.degradationTracker.getHealthStatus(eq)
  
        if (status.available < 2) {
          alerts.push({
            type: 'low_stock',
            severity: status.available === 0 ? 'high' : 'medium',
            message: `Low stock for ${eq.name}`,
            itemId: eq.id
          })
        }
  
        if (healthStatus.needsMaintenance) {
          alerts.push({
            type: 'maintenance_needed',
            severity: healthStatus.status === 'critical' ? 'high' : 'medium',
            message: `Maintenance required for ${eq.name}`,
            itemId: eq.id
          })
        }
  
        return {
          equipment: eq,
          ...status
        }
      })
  
      const consumablesStatus = consumables.map(consumable => {
        if (consumable.stockLevel <= consumable.minimumStock) {
          alerts.push({
            type: 'low_stock',
            severity: consumable.stockLevel === 0 ? 'high' : 'medium',
            message: `Low stock for consumable ${consumable.name}`,
            itemId: consumable.id
          })
        }
  
        return {
          consumable,
          currentStock: consumable.stockLevel,
          pendingOrders: 0,
          projectedUsage: this.calculateProjectedConsumableUsage(consumable.id, equipment)
        }
      })
  
      return {
        date: new Date().toISOString(),
        equipment: equipmentStatus,
        consumables: consumablesStatus,
        alerts
      }
    }
  
    generateProcurementNeeds(
      equipment: Equipment[],
      consumables: Consumable[]
    ): ProcurementNeed[] {
      const needs: ProcurementNeed[] = []
  
      // Equipment procurement needs
      equipment.forEach(eq => {
        const status = this.getInventoryStatus(eq)
        const healthStatus = this.degradationTracker.getHealthStatus(eq)
        const replacementPrediction = this.degradationTracker.predictReplacement(eq)
  
        if (status.available < 2 || replacementPrediction.daysUntilReplacement < 30) {
          needs.push({
            id: crypto.randomUUID(),
            itemType: 'equipment',
            itemId: eq.id,
            quantity: Math.max(2 - status.available, 0) + 
                     (replacementPrediction.daysUntilReplacement < 30 ? 1 : 0),
            estimatedCost: eq.acquisitionCost,
            priority: status.available === 0 ? 'high' : 'medium',
            reason: status.available < 2 
              ? 'Low stock level'
              : 'Upcoming replacement needed',
            requestDate: new Date().toISOString(),
            status: 'pending'
          })
        }
      })
  
      // Consumable procurement needs
      consumables.forEach(consumable => {
        if (consumable.stockLevel <= consumable.reorderPoint) {
          const orderQuantity = consumable.reorderPoint * 2 - consumable.stockLevel
          needs.push({
            id: crypto.randomUUID(),
            itemType: 'consumable',
            itemId: consumable.id,
            quantity: orderQuantity,
            estimatedCost: orderQuantity * consumable.costPerUnit,
            priority: consumable.stockLevel <= consumable.minimumStock ? 'high' : 'medium',
            reason: 'Stock below reorder point',
            requestDate: new Date().toISOString(),
            status: 'pending'
          })
        }
      })
  
      return needs.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
    }
  
    private calculateProjectedConsumableUsage(
      consumableId: string,
      equipment: Equipment[]
    ): number {
      return equipment.reduce((total, eq) => {
        const consumable = eq.consumables.find(c => c.id === consumableId)
        if (!consumable) return total
        
        // Calculate monthly usage based on average usage patterns
        const monthlyUsage = consumable.unitsPerUse * 4 * eq.inUse // Assuming weekly usage
        return total + monthlyUsage
      }, 0)
    }
  
    private triggerReorder(consumable: Consumable): void {
      // In a real implementation, this would integrate with a procurement system
      console.log(`Reorder triggered for ${consumable.name}:`, {
        currentStock: consumable.stockLevel,
        reorderPoint: consumable.reorderPoint,
        suggestedOrderQuantity: consumable.reorderPoint * 2 - consumable.stockLevel
      })
    }
  
    validateCombinationAvailability(
      combination: EquipmentCombination,
      equipment: Equipment[]
    ): {
      available: boolean
      missingEquipment: Array<{
        id: string
        name: string
        required: number
        available: number
      }>
    } {
      const missingEquipment = []
  
      for (const item of combination.equipment) {
        const equipmentItem = equipment.find(e => e.id === item.id)
        if (!equipmentItem) {
          missingEquipment.push({
            id: item.id,
            name: 'Unknown Equipment',
            required: item.quantity,
            available: 0
          })
          continue
        }
  
        const status = this.getInventoryStatus(equipmentItem)
        if (status.available < item.quantity) {
          missingEquipment.push({
            id: item.id,
            name: equipmentItem.name,
            required: item.quantity,
            available: status.available
          })
        }
      }
  
      return {
        available: missingEquipment.length === 0,
        missingEquipment
      }
    }
  }