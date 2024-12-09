import type { 
    Equipment, 
    EquipmentCombination, 
    Consumable,
    DegradationType 
  } from '@/types/equipment'
  import type { 
    InventoryTransaction, 
    ConsumableTransaction,
    ProcurementNeed 
  } from '@/types/inventory'
  
  // Cost Calculations
  export const calculateTotalCost = (equipment: Equipment[]): number => {
    return equipment.reduce((total, item) => total + item.acquisitionCost, 0)
  }
  
  export const calculateOperationalCost = (equipment: Equipment): number => {
    const baseOperationalCost = equipment.acquisitionCost * 0.1 // 10% of acquisition cost
    const degradationFactor = equipment.degradation.currentValue / equipment.degradation.maxValue
    return baseOperationalCost * (2 - degradationFactor) // Costs increase as equipment degrades
  }
  
  export const calculateMaintenanceCost = (equipment: Equipment): number => {
    const baseMaintenanceCost = equipment.acquisitionCost * 0.05 // 5% of acquisition cost
    const degradationFactor = equipment.degradation.currentValue / equipment.degradation.maxValue
    return baseMaintenanceCost * (2 - degradationFactor)
  }
  
  export const calculateTotalPersonnelCost = (equipment: Equipment[]): number => {
    const totalPersonnel = equipment.reduce((sum, eq) => sum + eq.personnelRequired, 0)
    return totalPersonnel * 5000 // $5000 per person per month
  }
  
  // Inventory Management
  export const calculateOptimalInventoryLevels = (
    consumable: Consumable,
    transactions: ConsumableTransaction[],
    leadTimeDays: number = 7
  ): {
    reorderPoint: number
    safetyStock: number
    optimalOrderQuantity: number
  } => {
    // Calculate average daily usage
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentTransactions = transactions.filter(t => 
      new Date(t.date) >= thirtyDaysAgo && t.type === 'use'
    )
  
    const averageDailyUsage = recentTransactions.reduce(
      (sum, t) => sum + t.quantity, 0
    ) / 30
  
    // Calculate safety stock (covers 2 standard deviations of demand during lead time)
    const usageVariance = calculateVariance(
      recentTransactions.map(t => t.quantity)
    )
    const safetyStock = Math.ceil(
      Math.sqrt(usageVariance) * 2 * Math.sqrt(leadTimeDays)
    )
  
    // Calculate reorder point
    const reorderPoint = Math.ceil(averageDailyUsage * leadTimeDays + safetyStock)
  
    // Calculate optimal order quantity (Economic Order Quantity)
    const annualDemand = averageDailyUsage * 365
    const orderingCost = 100 // Assumed fixed cost per order
    const holdingCost = consumable.costPerUnit * 0.2 // Assumed 20% holding cost
    const optimalOrderQuantity = Math.ceil(
      Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)
    )
  
    return {
      reorderPoint,
      safetyStock,
      optimalOrderQuantity
    }
  }
  
  // Degradation and Maintenance
  export const calculateDegradationRate = (
    equipment: Equipment,
    usage: {
      cycles?: number
      hours?: number
      days?: number
    }
  ): number => {
    const { type, degradationRate } = equipment.degradation
  
    switch (type) {
      case 'cycles':
        return (usage.cycles || 0) * degradationRate
      case 'hours':
        return (usage.hours || 0) * degradationRate
      case 'time':
        return (usage.days || 0) * degradationRate
      default:
        return 0
    }
  }
  
  export const predictMaintenanceNeeds = (
    equipment: Equipment,
    usagePattern: {
      cyclesPerDay?: number
      hoursPerDay?: number
    } = {}
  ): {
    daysUntilMaintenance: number
    maintenanceDate: Date
    estimatedCost: number
    priority: 'high' | 'medium' | 'low'
  } => {
    const { degradation } = equipment
    const remainingValue = degradation.currentValue
    const threshold = degradation.maxValue * 0.25 // 25% threshold for maintenance
  
    let daysUntilMaintenance: number
  
    switch (degradation.type) {
      case 'cycles':
        const cyclesPerDay = usagePattern.cyclesPerDay || 1
        daysUntilMaintenance = Math.floor(
          (remainingValue - threshold) / (degradation.degradationRate * cyclesPerDay)
        )
        break
      case 'hours':
        const hoursPerDay = usagePattern.hoursPerDay || 8
        daysUntilMaintenance = Math.floor(
          (remainingValue - threshold) / (degradation.degradationRate * hoursPerDay)
        )
        break
      case 'time':
        daysUntilMaintenance = Math.floor(
          (remainingValue - threshold) / degradation.degradationRate
        )
        break
      default:
        daysUntilMaintenance = 30
    }
  
    const maintenanceDate = new Date()
    maintenanceDate.setDate(maintenanceDate.getDate() + daysUntilMaintenance)
  
    const estimatedCost = calculateMaintenanceCost(equipment)
    
    const priority = daysUntilMaintenance <= 7 ? 'high' :
                    daysUntilMaintenance <= 30 ? 'medium' : 'low'
  
    return {
      daysUntilMaintenance,
      maintenanceDate,
      estimatedCost,
      priority
    }
  }
  
  // Combination Optimization
  export const optimizeCombination = (
    combination: EquipmentCombination,
    availableEquipment: Equipment[]
  ): {
    isOptimal: boolean
    suggestions: string[]
    optimizedQuantities: { id: string; quantity: number }[]
  } => {
    const suggestions: string[] = []
    const optimizedQuantities = [...combination.equipment]
    let isOptimal = true
  
    combination.equipment.forEach(item => {
      const equipment = availableEquipment.find(e => e.id === item.id)
      if (!equipment) return
  
      // Check for more efficient quantity
      const utilization = equipment.inUse / equipment.quantity
      if (utilization < 0.6 && item.quantity > 1) {
        isOptimal = false
        const suggestedQuantity = Math.ceil(item.quantity * 0.8)
        suggestions.push(
          `Consider reducing ${equipment.name} quantity from ${item.quantity} to ${suggestedQuantity}`
        )
        optimizedQuantities.find(q => q.id === item.id)!.quantity = suggestedQuantity
      }
  
      // Check for maintenance timing
      const maintenanceNeeds = predictMaintenanceNeeds(equipment)
      if (maintenanceNeeds.priority === 'high') {
        isOptimal = false
        suggestions.push(
          `Schedule maintenance for ${equipment.name} within ${maintenanceNeeds.daysUntilMaintenance} days`
        )
      }
  
      // Check for better alternatives
      const alternatives = availableEquipment.filter(e => 
        e.category === equipment.category &&
        e.id !== equipment.id &&
        e.degradation.currentValue / e.degradation.maxValue > 
        equipment.degradation.currentValue / equipment.degradation.maxValue
      )
  
      if (alternatives.length > 0) {
        const bestAlternative = alternatives.reduce((best, current) => 
          current.acquisitionCost < best.acquisitionCost ? current : best
        )
  
        if (bestAlternative.acquisitionCost < equipment.acquisitionCost * 0.8) {
          isOptimal = false
          suggestions.push(
            `Consider replacing ${equipment.name} with ${bestAlternative.name} for better efficiency`
          )
        }
      }
    })
  
    return {
      isOptimal,
      suggestions,
      optimizedQuantities
    }
  }
  
  // Utility Functions
  export const calculateVariance = (numbers: number[]): number => {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
    const squareDiffs = numbers.map(num => Math.pow(num - mean, 2))
    return squareDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
  }
  
  export const groupByCategory = <T extends { category: string }>(
    items: T[]
  ): Record<string, T[]> => {
    return items.reduce((grouped, item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
      return grouped
    }, {} as Record<string, T[]>)
  }
  
  export const groupByDateRange = (
    transactions: (InventoryTransaction | ConsumableTransaction)[],
    range: 'daily' | 'weekly' | 'monthly'
  ): Record<string, (InventoryTransaction | ConsumableTransaction)[]> => {
    return transactions.reduce((grouped, transaction) => {
      const date = new Date(transaction.date)
      let key: string
  
      switch (range) {
        case 'daily':
          key = date.toISOString().split('T')[0]
          break
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
      }
  
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(transaction)
      return grouped
    }, {} as Record<string, (InventoryTransaction | ConsumableTransaction)[]>)
  }
  
  export const calculateEfficiencyScore = (equipment: Equipment): number => {
    const utilizationScore = (equipment.inUse / equipment.quantity) * 100
    const healthScore = (equipment.degradation.currentValue / equipment.degradation.maxValue) * 100
    const costScore = Math.max(0, 100 - (calculateOperationalCost(equipment) / equipment.acquisitionCost) * 100)
  
    return (utilizationScore + healthScore + costScore) / 3
  }
  
  export const generateProcurementPlan = (
    equipment: Equipment[],
    consumables: Consumable[],
    budget: number
  ): ProcurementNeed[] => {
    const needs: ProcurementNeed[] = []
    let remainingBudget = budget
  
    // Equipment needs
    equipment.forEach(eq => {
      const maintenanceNeeds = predictMaintenanceNeeds(eq)
      if (maintenanceNeeds.priority === 'high' && remainingBudget >= eq.acquisitionCost) {
        needs.push({
          id: crypto.randomUUID(),
          itemType: 'equipment',
          itemId: eq.id,
          quantity: 1,
          estimatedCost: eq.acquisitionCost,
          priority: 'high',
          reason: `Critical replacement needed within ${maintenanceNeeds.daysUntilMaintenance} days`,
          requestDate: new Date().toISOString(),
          status: 'pending'
        })
        remainingBudget -= eq.acquisitionCost
      }
    })
  
    // Consumable needs
    consumables
      .filter(c => c.stockLevel <= c.minimumStock)
      .sort((a, b) => a.stockLevel / a.minimumStock - b.stockLevel / b.minimumStock)
      .forEach(c => {
        const orderQuantity = Math.max(
          c.reorderPoint - c.stockLevel,
          Math.ceil(c.minimumStock * 1.5)
        )
        const cost = orderQuantity * c.costPerUnit
  
        if (remainingBudget >= cost) {
          needs.push({
            id: crypto.randomUUID(),
            itemType: 'consumable',
            itemId: c.id,
            quantity: orderQuantity,
            estimatedCost: cost,
            priority: c.stockLevel === 0 ? 'high' : 'medium',
            reason: `Stock level below minimum (${c.stockLevel}/${c.minimumStock})`,
            requestDate: new Date().toISOString(),
            status: 'pending'
          })
          remainingBudget -= cost
        }
      })
  
    return needs
  }