/**
 * Intelligence Systems Types
 * Comprehensive type definitions for all four interconnected systems
 */

// ============================================================================
// PART 1: EMAIL INFERENCE ENGINE TYPES
// ============================================================================

export type RiskLevel = 'green' | 'yellow' | 'red'
export type EmailTone = 'professional' | 'casual' | 'frustrated' | 'demanding' | 'friendly' | 'neutral'
export type ActionRequired = 'none' | 'reply' | 'action' | 'escalation' | 'documentation'

export interface EmailInference {
  id: string
  email_id: string
  site_id: string
  sender_intent: string
  hidden_urgency: boolean
  expected_response: string
  actual_request: string
  action_items: string[]
  missing_info: string[]
  risk_level: RiskLevel
  tone: EmailTone
  deadline_pressure: string | null
  related_sites: string[]
  related_projects: string[]
  related_contracts: string[]
  action_required: ActionRequired
  sender_pattern_match: string | null
  confidence_score: number
  created_at: string
  updated_at: string
}

export interface EmailInferenceRequest {
  emailId: string
  siteId: string
  emailText: string
  senderEmail: string
}

export interface EmailInferenceResponse {
  id: string
  senderIntent: string
  hiddenUrgency: boolean
  expectedResponse: string
  actualRequest: string
  actionItems: string[]
  missingInfo: string[]
  riskLevel: RiskLevel
  tone: EmailTone
  deadlinePressure: string | null
  relatedSites: string[]
  relatedProjects: string[]
  relatedContracts: string[]
  actionRequired: ActionRequired
  senderPatternMatch: string | null
  confidenceScore: number
}

// ============================================================================
// PART 2: SENDER/RECEIVER LEARNING SYSTEM TYPES
// ============================================================================

export type CommunicationStyle = 'formal' | 'casual' | 'detailed' | 'brief' | 'mixed'
export type PreferredTone = 'formal' | 'casual' | 'neutral'
export type PatternType =
  | 'urgency_escalation'
  | 'slow_response'
  | 'needs_detail'
  | 'follows_up'
  | 'inconsistent_timing'
  | 'multi_email_threads'
  | 'deadline_focused'
  | 'detail_oriented'
  | 'quick_responder'
  | 'rarely_follows_up'
  | 'always_urgent'
  | 'decision_maker'
  | 'other'

export interface ContactProfile {
  id: string
  site_id: string
  user_id: string
  contact_email: string
  contact_id?: string
  communication_style: CommunicationStyle
  common_requests: string[]
  associated_sites: string[]
  associated_projects: string[]
  urgency_pattern: string
  response_expectations: Record<string, any>
  reliability_score: number
  prior_commitments: any[]
  preferred_tone: PreferredTone
  pain_points: string[]
  is_decision_maker: boolean
  avg_response_time_hours: number
  last_interacted_at: string
  interaction_count: number
  notes: string
  created_at: string
  updated_at: string
}

export interface SenderPattern {
  id: string
  contact_profile_id: string
  site_id: string
  pattern_type: PatternType
  pattern_data: Record<string, any>
  confidence: number
  last_observed_at: string
  occurrences_count: number
  created_at: string
  updated_at: string
}

export interface ContactProfileRequest {
  siteId: string
  userId: string
  contactEmail: string
  communicationStyle?: CommunicationStyle
  commonRequests?: string[]
  associatedSites?: string[]
  associatedProjects?: string[]
  urgencyPattern?: string
  responseExpectations?: Record<string, any>
  preferredTone?: PreferredTone
  painPoints?: string[]
  isDecisionMaker?: boolean
  notes?: string
}

// ============================================================================
// PART 3: CALENDAR INTELLIGENCE SYSTEM TYPES
// ============================================================================

export type EventType =
  | 'meeting'
  | 'reminder'
  | 'deadline'
  | 'follow_up'
  | 'milestone'
  | 'renewal'
  | 'pm_date'
  | 'site_visit'
  | 'task'

export type EventStatus = 'scheduled' | 'completed' | 'cancelled' | 'overdue'
export type ReminderType = 'notification' | 'email' | 'sms'
export type Recurrence = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface CalendarEvent {
  id: string
  site_id: string
  user_id: string
  title: string
  description: string
  event_type: EventType
  start_datetime: string
  end_datetime?: string
  duration_minutes?: number
  location?: string
  attendees: string[]
  all_day: boolean
  recurrence_rule?: string
  reminder_minutes_before: number[]
  linked_email_id?: string
  linked_project_id?: string
  linked_contract_id?: string
  linked_site_id?: string
  status: EventStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface CalendarReminder {
  id: string
  event_id: string
  reminder_type: ReminderType
  reminder_datetime: string
  sent: boolean
  sent_at?: string
  created_at: string
}

export interface RecurringTask {
  id: string
  site_id: string
  user_id: string
  title: string
  description: string
  recurrence: Recurrence
  recurrence_pattern: Record<string, any>
  linked_site_id?: string
  linked_project_id?: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface CalendarEventRequest {
  siteId: string
  userId: string
  title: string
  description?: string
  eventType?: EventType
  startDatetime: string
  endDatetime?: string
  durationMinutes?: number
  location?: string
  attendees?: string[]
  allDay?: boolean
  recurrenceRule?: string
  reminderMinutesBefore?: number[]
  linkedEmailId?: string
  linkedProjectId?: string
  linkedContractId?: string
  linkedSiteId?: string
  notes?: string
}

// ============================================================================
// PART 4: WORKFLOW INTELLIGENCE & COMMAND CENTER TYPES
// ============================================================================

export type WorkflowPatternType =
  | 'daily_task'
  | 'recurring_task'
  | 'common_action'
  | 'decision_pattern'
  | 'communication_pattern'
  | 'escalation_pattern'
  | 'follow_up_pattern'
  | 'other'

export type RecommendationType =
  | 'follow_up'
  | 'risk_flag'
  | 'missing_action'
  | 'optimization'
  | 'escalation'
  | 'deadline_alert'
  | 'pattern_alert'
  | 'opportunity'
  | 'other'

export type Priority = 'low' | 'medium' | 'high'
export type RecommendationStatus = 'pending' | 'dismissed' | 'completed' | 'archived'
export type ObservationType = 'pattern' | 'anomaly' | 'opportunity' | 'risk' | 'insight' | 'trend' | 'other'
export type Importance = 'low' | 'medium' | 'high'

export interface WorkflowPattern {
  id: string
  site_id: string
  user_id: string
  pattern_type: WorkflowPatternType
  pattern_name: string
  pattern_data: Record<string, any>
  frequency: string
  last_occurred_at?: string
  confidence: number
  created_at: string
  updated_at: string
}

export interface WorkflowRecommendation {
  id: string
  site_id: string
  user_id: string
  recommendation_type: RecommendationType
  recommendation_text: string
  reason?: string
  related_items: Record<string, any>
  priority: Priority
  status: RecommendationStatus
  created_at: string
  expires_at?: string
  dismissed_at?: string
  completed_at?: string
}

export interface AIObservation {
  id: string
  site_id: string
  user_id: string
  observation_text: string
  observation_type: ObservationType
  related_data: Record<string, any>
  importance: Importance
  is_acknowledged: boolean
  acknowledged_at?: string
  timestamp: string
}

export interface CommandCenterQuery {
  siteId: string
  userId: string
  query: string
}

export interface CommandCenterQueryResponse {
  query: string
  answer: string
  dataContext: {
    emailCount: number
    projectCount: number
    openActionItems: number
    contractCount: number
    pendingRecommendations: number
    upcomingEvents: number
  }
}

export interface CommandCenterWidgets {
  widgets: {
    attentionNeeded: {
      title: string
      overdueItems: any[]
      emailsWaitingReply: number
      projectsAtRisk: number
      upcomingDeadlines: any[]
      failedFollowUps: any[]
    }
    openActionItems: {
      title: string
      items: any[]
      totalCount: number
    }
    weeklyPath: {
      title: string
      deadlines: any[]
      projectCount: number
    }
    vendorIntelligence: {
      title: string
      vendors: any[]
      overdueCount: number
    }
    siteSnapshot: {
      title: string
      sites: any[]
      siteCount: number
    }
    changes: {
      title: string
      newEmails: number
      completedTasks: number
      changedAt: {
        yesterday: string
        today: string
      }
    }
    aiInsights: {
      title: string
      observations: AIObservation[]
      patterns: WorkflowPattern[]
    }
  }
  generatedAt: string
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface IntegrationContext {
  emailInferences: EmailInference[]
  contactProfiles: ContactProfile[]
  senderPatterns: SenderPattern[]
  calendarEvents: CalendarEvent[]
  workflowPatterns: WorkflowPattern[]
  workflowRecommendations: WorkflowRecommendation[]
  aiObservations: AIObservation[]
}

export interface UnifiedEmailDetail {
  email: any // Email from db
  inference: EmailInference
  senderProfile: ContactProfile
  relatedCalendarEvents: CalendarEvent[]
  relatedProjects: any[]
  relatedContracts: any[]
}

export interface ProjectIntelligence {
  project: any
  relatedEmails: any[]
  emailInferences: EmailInference[]
  deadlineEvents: CalendarEvent[]
  actionItems: any[]
  riskAssessment: {
    riskLevel: RiskLevel
    reasoning: string
    followUpSuggestions: string[]
  }
}
