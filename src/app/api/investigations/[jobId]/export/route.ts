import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId } = params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') as 'pdf' | 'json' | 'csv'

    if (!format || !['pdf', 'json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format parameter' },
        { status: 400 }
      )
    }

    const mockJob = {
      id: jobId,
      name: 'Investigation Report',
      status: 'complete',
      totalFiles: 3,
      processedFiles: 3,
    }

    let content = ''
    let contentType = 'application/octet-stream'
    let filename = `investigation-${jobId}.txt`

    if (format === 'json') {
      content = JSON.stringify(mockJob, null, 2)
      contentType = 'application/json'
      filename = `investigation-${jobId}.json`
    } else if (format === 'csv') {
      content = 'File,Risk Level,Risk Score,Summary\nvendor-agreement.pdf,HIGH,75,Critical gaps\n'
      contentType = 'text/csv'
      filename = `investigation-${jobId}.csv`
    } else {
      content = `INVESTIGATION REPORT\nJob: ${mockJob.name}\nStatus: ${mockJob.status}\n`
      contentType = 'text/plain'
      filename = `investigation-${jobId}.txt`
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting investigation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
