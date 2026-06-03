import { NextRequest, NextResponse } from 'next/server'
import type { InvestigationJob } from '@/types/investigations'

const mockJobs: InvestigationJob[] = [
  {
    id: 'job-1',
    name: 'Q4 Vendor Review',
    status: 'complete',
    totalFiles: 12,
    processedFiles: 12,
    createdAt: new Date('2024-01-15'),
    completedAt: new Date('2024-01-16'),
  },
  {
    id: 'job-2',
    name: 'Partnership Due Diligence',
    status: 'analyzing',
    totalFiles: 8,
    processedFiles: 5,
    createdAt: new Date('2024-01-18'),
  },
]

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ data: mockJobs, count: mockJobs.length })
  } catch (error) {
    console.error('Error fetching investigations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const jobName = formData.get('jobName') as string
    const files = formData.getAll('files') as File[]

    if (!jobName || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newJob: InvestigationJob = {
      id: `job-${Date.now()}`,
      name: jobName,
      status: 'pending',
      totalFiles: files.length,
      processedFiles: 0,
      createdAt: new Date(),
    }

    return NextResponse.json({ data: newJob }, { status: 201 })
  } catch (error) {
    console.error('Error creating investigation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
