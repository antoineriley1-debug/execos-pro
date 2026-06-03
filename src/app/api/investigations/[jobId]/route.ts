import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId } = params

    // Mock response
    const mockJob = {
      id: jobId,
      name: 'Investigation Job',
      status: 'complete',
      totalFiles: 5,
      processedFiles: 5,
      createdAt: new Date(),
    }

    return NextResponse.json({ data: mockJob })
  } catch (error) {
    console.error('Error fetching investigation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId } = params

    // Mock delete
    return NextResponse.json(
      { data: { id: jobId, deleted: true } },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting investigation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
