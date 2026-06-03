// API Route: POST /api/emails/[id]/execute-action
// Execute smart action suggestions (draft response, create task, etc.)

import { createClient } from '@supabase/supabase-js'
import { Anthropic } from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

interface ExecuteActionRequest {
  emailId: string
  actionType: string
  siteId: string
  additionalParams?: Record<string, any>
}

/**
 * Execute a smart action on an email
 * Handles: draft responses, create tasks, link projects, add contacts, etc.
 */
export async function POST(request: Request) {
  try {
    const { emailId, actionType, siteId, additionalParams }: ExecuteActionRequest =
      await request.json()

    if (!emailId || !actionType || !siteId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get email and analysis
    const { data: email } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .single()

    const { data: analysis } = await supabase
      .from('email_inferences')
      .select('*')
      .eq('email_id', emailId)
      .single()

    if (!email) {
      return Response.json({ error: 'Email not found' }, { status: 404 })
    }

    let actionResult: any = {}
    let generatedContent = ''
    let actionSummary = ''

    switch (actionType) {
      case 'draft_response':
      case 'draft_firm_response':
        actionResult = await draftFirmResponse(email, analysis)
        generatedContent = actionResult.content
        actionSummary = 'Generated firm, professional response'
        break

      case 'draft_friendly_response':
        actionResult = await draftFriendlyResponse(email, analysis)
        generatedContent = actionResult.content
        actionSummary = 'Generated friendly, collaborative response'
        break

      case 'draft_escalation':
        actionResult = await draftEscalationResponse(email, analysis)
        generatedContent = actionResult.content
        actionSummary = 'Generated escalation response'
        break

      case 'draft_summary':
      case 'draft_executive_summary':
        actionResult = await draftExecutiveSummary(email, analysis)
        generatedContent = actionResult.content
        actionSummary = 'Generated executive summary response'
        break

      case 'create_task':
        actionResult = await createTaskFromEmail(email, analysis, siteId, email.user_id)
        actionSummary = `Created task: "${actionResult.taskTitle}"`
        break

      case 'create_multiple_tasks':
        actionResult = await createMultipleTasksFromEmail(
          email,
          analysis,
          siteId,
          email.user_id
        )
        actionSummary = `Created ${actionResult.taskCount} tasks from action items`
        break

      case 'add_contact':
        actionResult = await createContactFromEmail(email, siteId, email.user_id)
        actionSummary = `Added contact: ${actionResult.contactEmail}`
        break

      case 'link_project':
        actionResult = await linkToProject(
          email,
          siteId,
          email.user_id,
          additionalParams?.projectId
        )
        actionSummary = `Linked to project: ${actionResult.projectName}`
        break

      case 'create_project':
        actionResult = await createProjectFromEmail(email, analysis, siteId, email.user_id)
        actionSummary = `Created project: "${actionResult.projectName}"`
        break

      case 'schedule_followup':
        actionResult = await scheduleFollowup(email, analysis, email.user_id)
        actionSummary = `Scheduled follow-up: ${actionResult.followupDate}`
        break

      case 'save_memory':
        actionResult = await saveToMemory(email, analysis, siteId, email.user_id)
        actionSummary = 'Saved email insights to memory'
        break

      case 'flag_compliance':
        actionResult = await flagForCompliance(email, analysis, siteId, email.user_id)
        actionSummary = 'Flagged for compliance review'
        break

      case 'escalate_risk':
        actionResult = await escalateRisk(email, analysis, siteId, email.user_id)
        actionSummary = 'Risk escalated to stakeholders'
        break

      case 'archive':
        actionResult = await archiveEmail(email)
        actionSummary = 'Email archived'
        break

      default:
        return Response.json(
          { error: `Unknown action type: ${actionType}` },
          { status: 400 }
        )
    }

    // Record action in database
    const { data: actionRecord, error: recordError } = await supabase
      .from('email_actions')
      .insert({
        user_id: email.user_id,
        email_id: emailId,
        action_type: actionType,
        action_status: 'completed',
        action_result: actionResult,
        action_summary: actionSummary,
        generated_content: generatedContent,
        executed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (recordError) {
      console.error('Error recording action:', recordError)
    }

    // Mark suggestion as executed if it exists
    await supabase
      .from('email_action_suggestions')
      .update({ executed: true, executed_at: new Date().toISOString() })
      .eq('email_id', emailId)
      .eq('action_type', actionType)

    return Response.json({
      success: true,
      actionType,
      actionId: actionRecord?.id,
      actionSummary,
      result: actionResult,
      generatedContent: generatedContent || undefined,
    })
  } catch (error) {
    console.error('Execute action error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to execute action' },
      { status: 500 }
    )
  }
}

/**
 * Draft a firm, professional response
 */
async function draftFirmResponse(email: any, analysis: any): Promise<any> {
  const prompt = `Generate a firm but professional response to this email. Be direct, clear, and assertive while maintaining professionalism.

FROM: ${email.sender_email}
SUBJECT: ${email.subject}
BODY: ${email.body_text?.substring(0, 500)}

EMAIL ANALYSIS:
Intent: ${analysis.sender_intent}
Request: ${analysis.actual_request}

Generate ONLY the response text, no subject line or greeting variations. Start with "Dear [sender name]," and end with "Best regards,\\n[Your name]".`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  return {
    content: content.text,
    tone: 'firm',
  }
}

/**
 * Draft a friendly, collaborative response
 */
async function draftFriendlyResponse(email: any, analysis: any): Promise<any> {
  const prompt = `Generate a warm, friendly, and collaborative response to this email. Be positive and encouraging.

FROM: ${email.sender_email}
SUBJECT: ${email.subject}
BODY: ${email.body_text?.substring(0, 500)}

EMAIL ANALYSIS:
Intent: ${analysis.sender_intent}
Request: ${analysis.actual_request}

Generate ONLY the response text. Start with "Dear [sender name]," and end with "Best regards,\\n[Your name]".`

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  return {
    content: content.text,
    tone: 'friendly',
  }
}

/**
 * Draft an escalation response
 */
async function draftEscalationResponse(email: any, analysis: any): Promise<any> {
  const prompt = `Generate a professional escalation response. Acknowledge the issue, explain what needs to happen, and indicate who needs to be involved.

FROM: ${email.sender_email}
SUBJECT: ${email.subject}
BODY: ${email.body_text?.substring(0, 500)}

EMAIL ANALYSIS:
Intent: ${analysis.sender_intent}
Problem: ${analysis.actual_request}
Risk: ${analysis.risk_level}

Generate ONLY the response text. Include: context, what needs to happen, timeline, and who's involved.`

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  return {
    content: content.text,
    tone: 'escalation',
  }
}

/**
 * Draft executive summary response
 */
async function draftExecutiveSummary(email: any, analysis: any): Promise<any> {
  const prompt = `Generate a brief, executive-level summary response to this email. Keep it to 2-3 sentences maximum.

FROM: ${email.sender_email}
SUBJECT: ${email.subject}
BODY: ${email.body_text?.substring(0, 500)}

EMAIL ANALYSIS:
Intent: ${analysis.sender_intent}
Request: ${analysis.actual_request}

Generate ONLY a concise response suitable for a busy executive.`

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  return {
    content: content.text,
    tone: 'executive_summary',
  }
}

/**
 * Create task(s) from email action items
 */
async function createTaskFromEmail(
  email: any,
  analysis: any,
  siteId: string,
  userId: string
): Promise<any> {
  const taskTitle = analysis.actual_request || email.subject
  const dueDate = analysis.deadline_pressure
    ? new Date(analysis.deadline_pressure).toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default 7 days

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      owner_id: userId,
      title: taskTitle,
      description: `Created from email: "${email.subject}"\n\n${email.body_text?.substring(0, 300)}`,
      due_date: dueDate,
      priority:
        analysis.risk_level === 'red'
          ? 'critical'
          : analysis.risk_level === 'yellow'
            ? 'high'
            : 'medium',
      status: 'not_started',
      estimated_hours: 2,
      success_criteria: 'Email action completed and follow-up sent if needed',
      related_email_id: email.id,
      related_project_id: siteId,
    })
    .select()
    .single()

  if (error) throw error

  return {
    taskId: task.id,
    taskTitle: task.title,
    dueDate: task.due_date,
  }
}

/**
 * Create multiple tasks from action items
 */
async function createMultipleTasksFromEmail(
  email: any,
  analysis: any,
  siteId: string,
  userId: string
): Promise<any> {
  const actionItems = analysis.action_items || []
  const taskRecords = actionItems.map((item: string) => ({
    user_id: userId,
    owner_id: userId,
    title: item,
    description: `Created from email: "${email.subject}"\nOriginal request: ${analysis.actual_request}`,
    due_date: analysis.deadline_pressure
      ? new Date(analysis.deadline_pressure).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    priority:
      analysis.risk_level === 'red'
        ? 'critical'
        : analysis.risk_level === 'yellow'
          ? 'high'
          : 'medium',
    status: 'not_started',
    estimated_hours: 1,
    success_criteria: 'Task completed',
    related_email_id: email.id,
    related_project_id: siteId,
  }))

  const { data: tasks, error } = await supabase
    .from('tasks')
    .insert(taskRecords)
    .select()

  if (error) throw error

  return {
    taskCount: tasks.length,
    taskIds: tasks.map((t: any) => t.id),
  }
}

/**
 * Create contact from email sender
 */
async function createContactFromEmail(
  email: any,
  siteId: string,
  userId: string
): Promise<any> {
  const contactName = email.sender_email.split('@')[0].replace(/[._-]/g, ' ')

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      site_id: siteId,
      user_id: userId,
      name: contactName,
      email: email.sender_email,
      type: 'vendor', // Default type
    })
    .select()
    .single()

  if (error && error.code !== '23505') throw error // Ignore if already exists

  return {
    contactId: contact?.id,
    contactEmail: contact?.email || email.sender_email,
  }
}

/**
 * Link email to existing project
 */
async function linkToProject(
  email: any,
  siteId: string,
  _userId: string,
  projectId?: string
): Promise<any> {
  if (!projectId) {
    // Auto-match project if not specified
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('site_id', siteId)
      .limit(1)

    projectId = projects?.[0]?.id
  }

  // Update task with project link if there's a related task
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('related_email_id', email.id)
    .single()

  if (task && projectId) {
    await supabase
      .from('tasks')
      .update({ related_project_id: projectId })
      .eq('id', task.id)
  }

  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single()

  return {
    projectId,
    projectName: project?.name || 'Project',
  }
}

/**
 * Create project from email
 */
async function createProjectFromEmail(
  email: any,
  analysis: any,
  siteId: string,
  userId: string
): Promise<any> {
  const projectName = email.subject || 'Email-based Project'
  const dueDate = analysis.deadline_pressure
    ? new Date(analysis.deadline_pressure).toISOString()
    : null

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      site_id: siteId,
      user_id: userId,
      name: projectName,
      description: `Created from email: ${email.body_text?.substring(0, 300)}`,
      status: 'planning',
      due_date: dueDate,
    })
    .select()
    .single()

  if (error) throw error

  return {
    projectId: project.id,
    projectName: project.name,
  }
}

/**
 * Schedule follow-up task
 */
async function scheduleFollowup(
  email: any,
  analysis: any,
  userId: string
): Promise<any> {
  const followupDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      owner_id: userId,
      title: `Follow up: ${email.subject}`,
      description: `Follow up with ${email.sender_email} regarding: ${analysis.actual_request}`,
      due_date: followupDate.toISOString(),
      priority: 'medium',
      status: 'not_started',
      estimated_hours: 0.5,
      success_criteria: 'Checked on status and sent follow-up if needed',
      related_email_id: email.id,
    })
    .select()
    .single()

  if (error) throw error

  return {
    taskId: task.id,
    followupDate: followupDate.toISOString(),
  }
}

/**
 * Save email insights to memory
 */
async function saveToMemory(
  email: any,
  analysis: any,
  siteId: string,
  userId: string
): Promise<any> {
  const { data: memory, error } = await supabase
    .from('memory_files')
    .insert({
      site_id: siteId,
      user_id: userId,
      title: `Email insight: ${email.subject}`,
      content: `From: ${email.sender_email}\nSubject: ${email.subject}\n\nKey insight: ${analysis.sender_intent}\n\nAction items: ${analysis.action_items?.join(', ')}`,
      tags: ['email', 'insight', analysis.risk_level],
    })
    .select()
    .single()

  if (error) throw error

  return {
    memoryId: memory.id,
    saved: true,
  }
}

/**
 * Flag for compliance review
 */
async function flagForCompliance(
  email: any,
  analysis: any,
  _siteId: string,
  userId: string
): Promise<any> {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      owner_id: userId,
      title: `[COMPLIANCE] Review: ${email.subject}`,
      description: `Compliance review required for email from ${email.sender_email}.\n\nReason: ${analysis.sender_intent}\nRisk Level: ${analysis.risk_level}`,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day
      priority: 'critical',
      status: 'not_started',
      estimated_hours: 1,
      success_criteria: 'Compliance team reviewed and approved/rejected',
      related_email_id: email.id,
    })
    .select()
    .single()

  if (error) throw error

  return {
    complianceTaskId: task.id,
    flagged: true,
  }
}

/**
 * Escalate risk to stakeholders
 */
async function escalateRisk(
  email: any,
  analysis: any,
  _siteId: string,
  userId: string
): Promise<any> {
  // Create escalation task
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      owner_id: userId,
      title: `[ESCALATION] ${email.subject}`,
      description: `⚠️ HIGH RISK EMAIL ESCALATION\n\nFrom: ${email.sender_email}\nRisk Level: ${analysis.risk_level}\n\nDetails: ${analysis.sender_intent}\n\nAction: Requires immediate stakeholder review and response`,
      due_date: new Date().toISOString(), // Immediate
      priority: 'critical',
      status: 'not_started',
      estimated_hours: 2,
      success_criteria: 'Stakeholders notified and decision made',
      related_email_id: email.id,
    })
    .select()
    .single()

  if (error) throw error

  return {
    escalationTaskId: task.id,
    escalated: true,
    riskLevel: analysis.risk_level,
  }
}

/**
 * Archive email
 */
async function archiveEmail(email: any): Promise<any> {
  const { error } = await supabase
    .from('emails')
    .update({ archived: true })
    .eq('id', email.id)
    .select()
    .single()

  if (error) throw error

  return {
    emailId: email.id,
    archived: true,
  }
}
