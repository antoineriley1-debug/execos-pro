'use client'

import { useState } from 'react'

interface SynthesisViewerProps {
  synthesis: {
    id: string
    week_start: string
    week_end: string
    content: string
    created_at: string
    source_email_count: number
    source_contract_count: number
    source_event_count: number
  }
}

export function SynthesisViewer({ synthesis }: SynthesisViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const startDate = new Date(synthesis.week_start)
  const endDate = new Date(synthesis.week_end)
  const createdDate = new Date(synthesis.created_at)

  const parseContent = (content: string) => {
    const sections: { title: string; content: string }[] = []
    const lines = content.split('\n')
    let currentSection = ''
    let currentContent = ''

    for (const line of lines) {
      if (line.match(/^#+\s/)) {
        if (currentSection && currentContent) {
          sections.push({ title: currentSection, content: currentContent.trim() })
        }
        currentSection = line.replace(/^#+\s/, '')
        currentContent = ''
      } else {
        currentContent += (currentContent ? '\n' : '') + line
      }
    }

    if (currentSection && currentContent) {
      sections.push({ title: currentSection, content: currentContent.trim() })
    }

    return sections
  }

  const sections = parseContent(synthesis.content)

  return (
    <div className="p-6">
      <div className="mb-6 pb-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Generated on {createdDate.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Emails Analyzed</div>
            <div className="text-2xl font-bold text-blue-600">{synthesis.source_email_count}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Contracts</div>
            <div className="text-2xl font-bold text-green-600">{synthesis.source_contract_count}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Events</div>
            <div className="text-2xl font-bold text-purple-600">{synthesis.source_event_count}</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {sections.slice(0, isExpanded ? sections.length : 3).map((section, idx) => (
          <div key={idx}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>

            {section.title.toLowerCase().includes('risk') ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="text-sm text-red-800 whitespace-pre-wrap">{section.content}</div>
              </div>
            ) : section.title.toLowerCase().includes('finding') ? (
              <ul className="space-y-2">
                {section.content.split('\n').map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="text-yellow-600 font-bold mt-0.5">•</span>
                    <span>{item.replace(/^[-•]\s?/, '')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {sections.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-6 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          {isExpanded ? '← Show Less' : 'Show More →'}
        </button>
      )}
    </div>
  )
}
