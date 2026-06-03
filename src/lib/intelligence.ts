/**
 * Intelligence Systems Utilities
 * Helper functions for all four interconnected systems
 */

import {
  EmailInference,
  ContactProfile,
  CalendarEvent,
  WorkflowRecommendation,
  RiskLevel,
  ActionRequired,
} from '@/types/intelligence'

/**
 * Email Inference Utilities
 */
export const emailInferenceUtils = {
  /**
   * Get color class for risk level
   */
  getRiskColor: (level: RiskLevel): string => {
    switch (level) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'green':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  },

  /**
   * Get icon for action required
   */
  getActionIcon: (action: ActionRequired): string => {
    switch (action) {
      case 'escalation':
        return '🚨'
      case 'action':
        return '✅'
      case 'reply':
        return '💬'
      case 'documentation':
        return '📄'
      default:
        return '✓'
    }
  },

  /**
   * Calculate email urgency score (0-100)
   */
  calculateUrgencyScore: (inference: EmailInference): number => {
    let score = 0

    if (inference.hidden_urgency) score += 40
    if (inference.risk_level === 'red') score += 30
    if (inference.risk_level === 'yellow') score += 15
    if (inference.deadline_pressure) score += 25
    if (
      inference.action_required === 'escalation' ||
      inference.action_required === 'action'
    ) {
      score += 15
    }

    return Math.min(score, 100)
  },

  /**
   * Format deadline pressure for display
   */
  formatDeadline: (deadline: string | null): string => {
    if (!deadline) return 'No deadline'

    // Try to parse as date
    const date = new Date(deadline)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }

    // Return as-is if not parseable
    return deadline
  },
}

/**
 * Contact Profile Utilities
 */
export const contactProfileUtils = {
  /**
   * Get reliability score badge
   */
  getReliabilityBadge: (
    score: number
  ): { color: string; label: string; icon: string } => {
    if (score >= 80) {
      return {
        color: 'bg-green-100 text-green-800',
        label: 'Very Reliable',
        icon: '✅',
      }
    } else if (score >= 60) {
      return {
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Mostly Reliable',
        icon: '⚠️',
      }
    } else if (score >= 40) {
      return {
        color: 'bg-orange-100 text-orange-800',
        label: 'Somewhat Reliable',
        icon: '⚠️',
      }
    } else {
      return {
        color: 'bg-red-100 text-red-800',
        label: 'Unreliable',
        icon: '❌',
      }
    }
  },

  /**
   * Get communication style icon
   */
  getCommunicationIcon: (style: string): string => {
    switch (style) {
      case 'formal':
        return '🎩'
      case 'casual':
        return '👋'
      case 'detailed':
        return '📚'
      case 'brief':
        return '⚡'
      default:
        return '💬'
    }
  },

  /**
   * Calculate average response time category
   */
  getResponseTimeCategory: (hours: number): string => {
    if (hours < 2) return 'Very Quick (< 2h)'
    if (hours < 8) return 'Quick (< 8h)'
    if (hours < 24) return 'Same Day'
    if (hours < 48) return '1-2 Days'
    return 'Slow (2+ Days)'
  },

  /**
   * Build summary of contact profile
   */
  buildProfileSummary: (profile: ContactProfile): string => {
    const parts = []

    if (profile.communication_style) {
      parts.push(`${profile.communication_style} communicator`)
    }

    if (profile.is_decision_maker) {
      parts.push('Decision maker')
    }

    if (profile.reliability_score >= 80) {
      parts.push('Very reliable')
    } else if (profile.reliability_score < 40) {
      parts.push('Often unreliable')
    }

    if (profile.interaction_count > 0) {
      parts.push(`${profile.interaction_count} interactions`)
    }

    return parts.join(' • ') || 'New contact'
  },
}

/**
 * Calendar Utilities
 */
export const calendarUtils = {
  /**
   * Get event type color
   */
  getEventTypeColor: (type: string): string => {
    switch (type) {
      case 'deadline':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'meeting':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'follow_up':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'reminder':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'milestone':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'renewal':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      case 'pm_date':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'site_visit':
        return 'bg-pink-100 text-pink-800 border-pink-300'
      case 'task':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  },

  /**
   * Get event type icon
   */
  getEventTypeIcon: (type: string): string => {
    switch (type) {
      case 'deadline':
        return '⏰'
      case 'meeting':
        return '👥'
      case 'follow_up':
        return '📞'
      case 'reminder':
        return '🔔'
      case 'milestone':
        return '🎯'
      case 'renewal':
        return '🔄'
      case 'pm_date':
        return '🔧'
      case 'site_visit':
        return '📍'
      case 'task':
        return '✓'
      default:
        return '📅'
    }
  },

  /**
   * Format event date/time for display
   */
  formatEventDateTime: (event: CalendarEvent): string => {
    const start = new Date(event.start_datetime)

    if (event.all_day) {
      return start.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    }

    return start.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      meridiem: 'short',
    })
  },

  /**
   * Calculate days until event
   */
  daysUntilEvent: (event: CalendarEvent): number => {
    const now = new Date()
    const eventDate = new Date(event.start_datetime)
    const diff = eventDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  },

  /**
   * Check if event is overdue
   */
  isOverdue: (event: CalendarEvent): boolean => {
    return event.status === 'overdue' || calendarUtils.daysUntilEvent(event) < 0
  },

  /**
   * Check if event is happening soon (within 48h)
   */
  isHappeningSoon: (event: CalendarEvent): boolean => {
    const days = calendarUtils.daysUntilEvent(event)
    return days >= 0 && days <= 2
  },
}

/**
 * Recommendation Utilities
 */
export const recommendationUtils = {
  /**
   * Get priority color
   */
  getPriorityColor: (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  },

  /**
   * Get priority icon
   */
  getPriorityIcon: (priority: string): string => {
    switch (priority) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟡'
      case 'low':
        return '🟢'
      default:
        return '⚪'
    }
  },

  /**
   * Get status badge
   */
  getStatusBadge: (status: string): { color: string; label: string } => {
    switch (status) {
      case 'pending':
        return { color: 'bg-blue-100 text-blue-800', label: 'Pending' }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', label: 'Completed' }
      case 'dismissed':
        return { color: 'bg-gray-100 text-gray-800', label: 'Dismissed' }
      case 'archived':
        return { color: 'bg-gray-200 text-gray-800', label: 'Archived' }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status }
    }
  },

  /**
   * Build recommendation summary
   */
  buildSummary: (rec: WorkflowRecommendation): string => {
    const text = rec.recommendation_text
    if (text.length <= 100) return text
    return text.substring(0, 97) + '...'
  },
}

/**
 * General Utilities
 */
export const generalUtils = {
  /**
   * Format date for display
   */
  formatDate: (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  },

  /**
   * Format relative time (e.g., "2 days ago")
   */
  formatRelativeTime: (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' years ago'

    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' months ago'

    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' days ago'

    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' hours ago'

    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' minutes ago'

    return Math.floor(seconds) + ' seconds ago'
  },

  /**
   * Calculate confidence score color
   */
  getConfidenceColor: (score: number): string => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  },

  /**
   * Batch items by date
   */
  batchByDate: (
    items: any[],
    dateField: string
  ): { [key: string]: any[] } => {
    const batches: { [key: string]: any[] } = {}

    items.forEach((item) => {
      const date = new Date(item[dateField])
      const key = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

      if (!batches[key]) {
        batches[key] = []
      }
      batches[key].push(item)
    })

    return batches
  },

  /**
   * Calculate statistics from numbers
   */
  calculateStats: (
    numbers: number[]
  ): { avg: number; min: number; max: number; median: number } => {
    if (numbers.length === 0) {
      return { avg: 0, min: 0, max: 0, median: 0 }
    }

    const sorted = [...numbers].sort((a, b) => a - b)
    const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]

    return { avg, min, max, median }
  },
}
