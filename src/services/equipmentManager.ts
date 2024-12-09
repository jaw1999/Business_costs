// src/services/equipmentManager.ts

import { BaseService } from './baseService';
import { DegradationTrackerService } from './degradationTracker';
import type { Equipment, EquipmentCombination } from '@/types/equipment';

export class EquipmentManagerService extends BaseService {
  private degradationTracker: DegradationTrackerService;
  private equipment = new Map<string, Equipment>();
  private combinations = new Map<string, EquipmentCombination>();

  protected constructor() {
    super();
    this.degradationTracker = DegradationTrackerService.getInstance();
  }

  static getInstance(): EquipmentManagerService {
    return BaseService.getInstance.call(this);
  }

  registerEquipment(equipment: Equipment): void {
    try {
      this.validateInput(equipment, 'equipment');
      
      if (this.equipment.has(equipment.id)) {
        throw new Error(`Equipment with ID ${equipment.id} already exists`);
      }

      this.equipment.set(equipment.id, equipment);
      this.degradationTracker.initializeEquipment(equipment);
      this.emit('equipmentRegistered', equipment);
    } catch (error) {
      this.handleError(error, 'registerEquipment');
    }
  }

  getEquipment(id: string): Equipment {
    const equipment = this.equipment.get(id);
    if (!equipment) {
      throw new Error(`Equipment with ID ${id} not found`);
    }
    return equipment;
  }

  updateEquipment(id: string, updates: Partial<Equipment>): void {
    try {
      const existing = this.getEquipment(id);
      const updated = { ...existing, ...updates };
      this.equipment.set(id, updated);
      this.emit('equipmentUpdated', updated);
    } catch (error) {
      this.handleError(error, 'updateEquipment');
    }
  }

  registerCombination(combination: EquipmentCombination): void {
    try {
      this.validateInput(combination, 'combination');
      
      if (this.combinations.has(combination.id)) {
        throw new Error(`Combination with ID ${combination.id} already exists`);
      }

      // Validate all equipment exists
      combination.equipment.forEach(eq => {
        if (!this.equipment.has(eq.id)) {
          throw new Error(`Equipment ${eq.id} not found`);
        }
      });

      this.combinations.set(combination.id, combination);
      this.emit('combinationRegistered', combination);
    } catch (error) {
      this.handleError(error, 'registerCombination');
    }
  }

  getCombination(id: string): EquipmentCombination {
    const combination = this.combinations.get(id);
    if (!combination) {
      throw new Error(`Combination with ID ${id} not found`);
    }
    return combination;
  }

  calculateEfficiency(combination: EquipmentCombination): {
    overall: number;
    operational: number;
    cost: number;
    personnel: number;
  } {
    try {
      const equipmentEfficiencies = combination.equipment.map(eq => {
        const equipment = this.getEquipment(eq.id);
        const degradation = this.degradationTracker.getDegradation(eq.id);
        return {
          operational: (degradation.currentValue / degradation.maxValue) * 100,
          cost: (equipment.operationalCosts.personnelCostPerHour > 0 ? 
            50 / equipment.operationalCosts.personnelCostPerHour : 50) * 100,
          personnel: (equipment.personnelRequired > 0 ? 
            100 / equipment.personnelRequired : 100) * 100
        };
      });

      const averages = {
        operational: equipmentEfficiencies.reduce((sum, eff) => sum + eff.operational, 0) / equipmentEfficiencies.length,
        cost: equipmentEfficiencies.reduce((sum, eff) => sum + eff.cost, 0) / equipmentEfficiencies.length,
        personnel: equipmentEfficiencies.reduce((sum, eff) => sum + eff.personnel, 0) / equipmentEfficiencies.length
      };

      return {
        overall: (averages.operational * 0.4 + averages.cost * 0.3 + averages.personnel * 0.3),
        operational: averages.operational,
        cost: averages.cost,
        personnel: averages.personnel
      };
    } catch (error) {
      this.handleError(error, 'calculateEfficiency');
    }
  }

  validateCombination(combination: EquipmentCombination): { 
    valid: boolean; 
    message?: string; 
  } {
    try {
      // Check if all equipment exists and is available
      for (const eq of combination.equipment) {
        const equipment = this.getEquipment(eq.id);
        const available = equipment.quantity - equipment.inUse;
        
        if (available < eq.quantity) {
          return {
            valid: false,
            message: `Insufficient quantity of ${equipment.name} available`
          };
        }

        const degradation = this.degradationTracker.getDegradation(eq.id);
        if (degradation.currentValue < 25) {
          return {
            valid: false,
            message: `${equipment.name} requires maintenance before use`
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  getMaintenanceSchedule(equipmentId: string): {
    nextDue: string;
    interval: number;
  } {
    const equipment = this.getEquipment(equipmentId);
    return {
      nextDue: equipment.maintenanceSchedule.nextDue,
      interval: equipment.maintenanceSchedule.interval
    };
  }

  protected override async initializeService(): Promise<void> {
    // Clear existing data
    this.equipment.clear();
    this.combinations.clear();
  }
}