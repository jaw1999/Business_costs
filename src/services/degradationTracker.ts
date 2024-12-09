import type { Equipment, DegradationParams } from '@/types/equipment'

export class DegradationTrackerService {
  private static instance: DegradationTrackerService

  private constructor() {}

  public static getInstance(): DegradationTrackerService {
    if (!DegradationTrackerService.instance) {
      DegradationTrackerService.instance = new DegradationTrackerService()
    }
    return DegradationTrackerService.instance
  }

  calculateDegradation(equipment: Equipment, usage: {
    cycles?: number;
    hours?: number;
    days?: number;
  }): DegradationParams {
    const { degradation } = equipment
    const newDegradation = { ...degradation }

    switch (degradation.type) {
      case 'cycles':
        if (usage.cycles) {
          newDegradation.currentValue = Math.max(
            0,
            degradation.currentValue - (usage.cycles * degradation.degradationRate)
          )
        }
        break

      case 'hours':
        if (usage.hours) {
          newDegradation.currentValue = Math.max(
            0,
            degradation.currentValue - (usage.hours * degradation.degradationRate)
          )
        }
        break

      case 'time':
        if (usage.days) {
          newDegradation.currentValue = Math.max(
            0,
            degradation.currentValue - (usage.days * degradation.degradationRate)
          )
        }
        break
    }

    newDegradation.lastUpdated = new Date().toISOString()
    return newDegradation
  }

  predictReplacement(equipment: Equipment): {
    daysUntilReplacement: number;
    estimatedReplacementDate: string;
    currentHealthPercentage: number;
  } {
    const { degradation } = equipment
    const currentHealth = (degradation.currentValue / degradation.maxValue) * 100

    // Calculate daily degradation rate
    let dailyRate: number
    switch (degradation.type) {
      case 'cycles':
        dailyRate = degradation.degradationRate * 1 // Assume 1 cycle per day
        break
      case 'hours':
        dailyRate = degradation.degradationRate * 24 // Convert to daily rate
        break
      case 'time':
        dailyRate = degradation.degradationRate
        break
    }

    const daysRemaining = Math.floor(degradation.currentValue / dailyRate)
    const replacementDate = new Date()
    replacementDate.setDate(replacementDate.getDate() + daysRemaining)

    return {
      daysUntilReplacement: daysRemaining,
      estimatedReplacementDate: replacementDate.toISOString(),
      currentHealthPercentage: currentHealth
    }
  }

  calculateMaintenanceCosts(equipment: Equipment): {
    monthly: number;
    yearly: number;
    nextMaintenance: string;
  } {
    const baseMaintenanceCost = equipment.acquisitionCost * 0.02 // 2% of acquisition cost
    const { degradation } = equipment
    const healthFactor = degradation.currentValue / degradation.maxValue

    // Maintenance costs increase as health decreases
    const adjustedMonthlyCost = baseMaintenanceCost * (2 - healthFactor)

    // Calculate next maintenance based on health
    const daysUntilMaintenance = Math.floor(
      (healthFactor * 90) // Maximum 90 days between maintenance
    )
    const nextMaintenance = new Date()
    nextMaintenance.setDate(nextMaintenance.getDate() + daysUntilMaintenance)

    return {
      monthly: adjustedMonthlyCost,
      yearly: adjustedMonthlyCost * 12,
      nextMaintenance: nextMaintenance.toISOString()
    }
  }

  getHealthStatus(equipment: Equipment): {
    status: 'good' | 'fair' | 'poor' | 'critical';
    message: string;
    needsMaintenance: boolean;
  } {
    const healthPercentage = (equipment.degradation.currentValue / equipment.degradation.maxValue) * 100

    if (healthPercentage > 75) {
      return {
        status: 'good',
        message: 'Equipment is in good condition',
        needsMaintenance: false
      }
    } else if (healthPercentage > 50) {
      return {
        status: 'fair',
        message: 'Equipment is functioning adequately',
        needsMaintenance: false
      }
    } else if (healthPercentage > 25) {
      return {
        status: 'poor',
        message: 'Equipment requires attention',
        needsMaintenance: true
      }
    } else {
      return {
        status: 'critical',
        message: 'Immediate maintenance required',
        needsMaintenance: true
      }
    }
  }

  generateMaintenanceReport(equipment: Equipment): {
    status: string;
    lastMaintenance: string;
    nextMaintenance: string;
    estimatedCosts: number;
    recommendations: string[];
  } {
    const healthStatus = this.getHealthStatus(equipment)
    const maintenanceCosts = this.calculateMaintenanceCosts(equipment)
    const replacementPrediction = this.predictReplacement(equipment)

    const recommendations: string[] = []

    if (healthStatus.needsMaintenance) {
      recommendations.push('Schedule immediate maintenance check')
    }

    if (replacementPrediction.daysUntilReplacement < 30) {
      recommendations.push('Plan for equipment replacement within 30 days')
    }

    if (equipment.degradation.currentValue < equipment.degradation.maxValue * 0.5) {
      recommendations.push('Consider preventive maintenance to extend equipment life')
    }

    return {
      status: healthStatus.status,
      lastMaintenance: equipment.degradation.lastUpdated,
      nextMaintenance: maintenanceCosts.nextMaintenance,
      estimatedCosts: maintenanceCosts.monthly,
      recommendations
    }
  }
}