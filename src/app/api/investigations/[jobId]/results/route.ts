import { NextRequest, NextResponse } from 'next/server'
import type { Finding } from '@/types/investigations'

const mockFindings: Finding[] = [
  {
    filename: 'vendor-agreement.pdf',
    content: 'Vendor agreement text...',
    keyFindings: [
      'Missing indemnification clause',
      'Liability cap above industry standard',
      'Payment terms: Net 30',
    ],
    riskScore: 75,
    riskLevel: 'high',
    entities: ['Acme Corp', 'John Smith', '$500K'],
    sentiment: 'neutral',
    summary: 'Critical gaps in liability and indemnification protections',
  },
  {
    filename: 'financial-report.xlsx',
    content: 'Financial data...',
    keyFindings: [
      'Revenue growth 12% YoY',
      'Debt-to-equity ratio high',
      'Profitability declining',
    ],
    riskScore: 62,
    riskLevel: 'medium',
    entities: ['$2.5M debt', 'EBITDA positive'],
    sentiment: 'negative',
    summary: 'Vendor financial health showing warning signs',
  },
  {
    filename: 'compliance-cert.pdf',
    content: 'Compliance certifications...',
    keyFindings: [
      'ISO 27001 certified',
      'SOC 2 Type II audit complete',
      'GDPR compliant',
    ],
    riskScore: 15,
    riskLevel: 'low',
    entities: ['ISO', 'SOC 2', 'GDPR'],
    sentiment: 'positive',
    summary: 'Strong compliance credentials',
  },
]

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

    const avgRisk = Math.round(
      mockFindings.reduce((sum, f) => sum + f.riskScore, 0) / mockFindings.length
    )

    return NextResponse.json({
      data: {
        findings: mockFindings,
        commonThemes: [
          'Financial Risk',
          'Compliance Gap',
          'Contract Terms',
          'Data Security',
        ],
        topRisks: [
          'Missing indemnification clause in vendor agreement',
          'Declining vendor profitability',
        ],
        summary: {
          totalFiles: 3,
          avgRiskScore: avgRisk,
          highRiskCount: mockFindings.filter((f) => f.riskLevel === 'high')
            .length,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
