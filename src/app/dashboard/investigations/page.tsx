'use client'

import React, { useState, useEffect } from 'react'
import { BulkUploadDropzone } from '@/components/BulkUploadDropzone'
import { EmailImportPanel } from '@/components/EmailImportPanel'
import { InvestigationJobCard } from '@/components/InvestigationJobCard'
import { InvestigationResults } from '@/components/InvestigationResults'
import { InvestigationExport } from '@/components/InvestigationExport'
import type { InvestigationJob, Finding } from '@/types/investigations'

export default function InvestigationsPage() {
  const [jobs, setJobs] = useState<InvestigationJob[]>([])
  const [selectedJob, setSelectedJob] = useState<InvestigationJob | null>(null)
  const [showUpload, setShowUpload] = useState(true)
  const [uploadTab, setUploadTab] = useState<'files' | 'email'>('files')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Load sample jobs for demonstration
  useEffect(() => {
    const sampleJobs: InvestigationJob[] = [
      {
        id: 'job-1',
        name: 'Q4 Vendor Review',
        status: 'complete',
        totalFiles: 12,
        processedFiles: 12,
        createdAt: new Date('2024-01-15'),
        completedAt: new Date('2024-01-16'),
        findings: [
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
            keyFindings: ['Revenue growth 12% YoY', 'Debt-to-equity ratio high', 'Profitability declining'],
            riskScore: 62,
            riskLevel: 'medium',
            entities: ['$2.5M debt', 'EBITDA positive'],
            sentiment: 'negative',
            summary: 'Vendor financial health showing warning signs',
          },
          {
            filename: 'compliance-cert.pdf',
            content: 'Compliance certifications...',
            keyFindings: ['ISO 27001 certified', 'SOC 2 Type II audit complete', 'GDPR compliant'],
            riskScore: 15,
            riskLevel: 'low',
            entities: ['ISO', 'SOC 2', 'GDPR'],
            sentiment: 'positive',
            summary: 'Strong compliance credentials',
          },
        ],
        commonThemes: ['Financial Risk', 'Compliance Gap', 'Contract Terms', 'Data Security'],
        topRisks: [
          'Missing indemnification clause in vendor agreement',
          'Declining vendor profitability',
        ],
      },
      {
        id: 'job-2',
        name: 'Partnership Due Diligence',
        status: 'analyzing',
        totalFiles: 8,
        processedFiles: 5,
        createdAt: new Date('2024-01-18'),
      },
      {
        id: 'job-3',
        name: 'Contract Review - 2024',
        status: 'pending',
        totalFiles: 20,
        processedFiles: 0,
        createdAt: new Date('2024-01-19'),
      },
      {
        id: 'job-4',
        name: 'Risk Assessment',
        status: 'failed',
        totalFiles: 5,
        processedFiles: 2,
        createdAt: new Date('2024-01-17'),
        errorMessage: 'Processing failed: Unable to parse document format',
      },
    ]

    setJobs(sampleJobs)
  }, [])

  // Simulate job progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job.status === 'analyzing' && job.processedFiles < job.totalFiles) {
            return {
              ...job,
              processedFiles: Math.min(job.processedFiles + 1, job.totalFiles),
              status: job.processedFiles + 1 === job.totalFiles ? 'complete' : 'analyzing',
            }
          }
          return job
        })
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleUpload = async (jobName: string, files: File[]) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 30
        })
      }, 200)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Create new job
      const newJob: InvestigationJob = {
        id: `job-${Date.now()}`,
        name: jobName,
        status: 'pending',
        totalFiles: files.length,
        processedFiles: 0,
        createdAt: new Date(),
      }

      setJobs([newJob, ...jobs])
      setShowUpload(false)

      // Simulate status change after delay
      setTimeout(() => {
        setJobs((prevJobs) =>
          prevJobs.map((job) => (job.id === newJob.id ? { ...job, status: 'analyzing' } : job))
        )
      }, 1000)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleEmailMerge = (emailContent: string) => {
    // Email content would be merged with files for analysis
    console.log('Email merged:', emailContent)
  }

  const handleEmailSeparate = (emailContent: string) => {
    // Email would be analyzed as separate job
    console.log('Email separate job:', emailContent)
  }

  const handleViewResults = (job: InvestigationJob) => {
    setSelectedJob(job)
  }

  const handleRetry = (jobId: string) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === jobId
          ? { ...job, status: 'pending', processedFiles: 0, errorMessage: undefined }
          : job
      )
    )
  }

  const handleDelete = (jobId: string) => {
    setJobs(jobs.filter((job) => job.id !== jobId))
    if (selectedJob?.id === jobId) {
      setSelectedJob(null)
    }
  }

  const activeJobs = jobs.filter((job) => ['pending', 'analyzing'].includes(job.status))
  const completedJobs = jobs.filter((job) => job.status === 'complete')
  const failedJobs = jobs.filter((job) => job.status === 'failed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Investigations</h1>
          <p className="text-gray-600 mt-1">Upload and analyze documents in batch</p>
        </div>
        {!showUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            + New Investigation
          </button>
        )}
      </div>

      {/* Selected Job Results View */}
      {selectedJob && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Results */}
            <div className="lg:col-span-2">
              <InvestigationResults
                job={selectedJob}
                onClose={() => setSelectedJob(null)}
              />
            </div>

            {/* Export */}
            <div>
              <InvestigationExport job={selectedJob} />
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {showUpload && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">New Investigation</h2>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setUploadTab('files')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                uploadTab === 'files'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Upload Files
            </button>
            <button
              onClick={() => setUploadTab('email')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                uploadTab === 'email'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Import Emails
            </button>
          </div>

          {/* Content */}
          {uploadTab === 'files' ? (
            <BulkUploadDropzone
              onUpload={handleUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          ) : (
            <EmailImportPanel
              onMergeWithFiles={handleEmailMerge}
              onCreateSeparateJob={handleEmailSeparate}
            />
          )}
        </div>
      )}

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Investigations ({activeJobs.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map((job) => (
              <InvestigationJobCard
                key={job.id}
                job={job}
                onViewResults={handleViewResults}
                onRetry={handleRetry}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Completed Investigations ({completedJobs.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedJobs.map((job) => (
              <InvestigationJobCard
                key={job.id}
                job={job}
                onViewResults={handleViewResults}
                onRetry={handleRetry}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Failed Jobs */}
      {failedJobs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Failed Investigations ({failedJobs.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {failedJobs.map((job) => (
              <InvestigationJobCard
                key={job.id}
                job={job}
                onViewResults={handleViewResults}
                onRetry={handleRetry}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {jobs.length === 0 && showUpload && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No investigations yet. Start by uploading files above.</p>
        </div>
      )}
    </div>
  )
}
