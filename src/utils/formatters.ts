export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  export const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100)
  }
  
  export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (format === 'long') {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  export const formatDuration = (days: number): string => {
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days < 0) return `${Math.abs(days)} days ago`
    if (days < 30) return `${days} days`
    if (days < 365) {
      const months = Math.floor(days / 30)
      return `${months} ${months === 1 ? 'month' : 'months'}`
    }
    const years = Math.floor(days / 365)
    const remainingMonths = Math.floor((days % 365) / 30)
    return remainingMonths > 0 
      ? `${years}y ${remainingMonths}m`
      : `${years} ${years === 1 ? 'year' : 'years'}`
  }
  
  export const formatQuantity = (
    quantity: number,
    unit?: string,
    precision: number = 0
  ): string => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(quantity)
    
    return unit ? `${formatted} ${unit}` : formatted
  }
  
  export const formatName = (name: string, maxLength: number = 30): string => {
    if (name.length <= maxLength) return name
    return `${name.slice(0, maxLength - 3)}...`
  }
  
  export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
  
  export const formatStatus = (
    status: string,
    type: 'health' | 'priority' | 'procurement' = 'health'
  ): { text: string; color: string } => {
    const statusMap: Record<string, { text: string; color: string }> = {
      // Health status
      good: { text: 'Good Condition', color: 'text-green-600' },
      fair: { text: 'Fair Condition', color: 'text-yellow-600' },
      poor: { text: 'Poor Condition', color: 'text-orange-600' },
      critical: { text: 'Critical Condition', color: 'text-red-600' },
      
      // Priority status
      high: { text: 'High Priority', color: 'text-red-600' },
      medium: { text: 'Medium Priority', color: 'text-yellow-600' },
      low: { text: 'Low Priority', color: 'text-blue-600' },
      
      // Procurement status
      pending: { text: 'Pending', color: 'text-yellow-600' },
      approved: { text: 'Approved', color: 'text-green-600' },
      ordered: { text: 'Ordered', color: 'text-blue-600' },
      received: { text: 'Received', color: 'text-green-600' }
    }
  
    return statusMap[status.toLowerCase()] || { text: status, color: 'text-gray-600' }
  }
  
  export const formatDegradation = (
    current: number,
    max: number
  ): { percentage: number; status: string; color: string } => {
    const percentage = (current / max) * 100
    
    if (percentage > 75) {
      return {
        percentage,
        status: 'Good',
        color: 'bg-green-500'
      }
    }
    if (percentage > 50) {
      return {
        percentage,
        status: 'Fair',
        color: 'bg-yellow-500'
      }
    }
    if (percentage > 25) {
      return {
        percentage,
        status: 'Poor',
        color: 'bg-orange-500'
      }
    }
    return {
      percentage,
      status: 'Critical',
      color: 'bg-red-500'
    }
  }
  
  export const formatTrend = (
    current: number,
    previous: number
  ): { value: number; direction: 'up' | 'down' | 'stable'; color: string } => {
    if (previous === 0) return { value: 0, direction: 'stable', color: 'text-gray-600' }
    
    const percentageChange = ((current - previous) / previous) * 100
    const direction = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'stable'
    
    return {
      value: Math.abs(percentageChange),
      direction,
      color: direction === 'up' ? 'text-green-600' : 
             direction === 'down' ? 'text-red-600' : 
             'text-gray-600'
    }
  }