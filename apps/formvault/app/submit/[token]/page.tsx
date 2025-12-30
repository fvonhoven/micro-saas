'use client'

import { useEffect, useState } from 'react'
import { Button } from '@repo/ui'
import { adminDb } from '@repo/firebase/admin'

interface AccessLink {
  clientName: string
  clientEmail: string
  expiresAt: Date
  maxUses: number
  useCount: number
}

interface Form {
  name: string
  description: string
  maxFileSize: number
}

export default function SubmitPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<Form | null>(null)
  const [accessLink, setAccessLink] = useState<AccessLink | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    validateToken()
  }, [params.token])

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/validate-token/${params.token}`)
      if (!response.ok) {
        throw new Error('Invalid or expired link')
      }
      const data = await response.json()
      setForm(data.form)
      setAccessLink(data.accessLink)
    } catch (err: any) {
      setError(err.message || 'Invalid link')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Create submission
      const submissionResponse = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token }),
      })

      if (!submissionResponse.ok) {
        throw new Error('Failed to create submission')
      }

      const { submissionId } = await submissionResponse.json()

      // Upload each file
      for (const file of files) {
        const urlResponse = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            submissionId,
            contentType: file.type,
          }),
        })

        const { uploadUrl } = await urlResponse.json()

        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow max-w-md text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Upload Successful!</h2>
          <p className="text-gray-600">
            Your documents have been uploaded successfully. You can close this page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-2">{form?.name}</h1>
          {form?.description && (
            <p className="text-gray-600 mb-6">{form.description}</p>
          )}

          <div className="bg-blue-50 p-4 rounded mb-6">
            <p className="text-sm">
              <strong>Uploading as:</strong> {accessLink?.clientName} ({accessLink?.clientEmail})
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Files (Max {form?.maxFileSize}MB per file)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full"
                disabled={uploading}
              />
            </div>

            {files.length > 0 && (
              <div className="text-sm text-gray-600">
                {files.length} file(s) selected
              </div>
            )}

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? 'Uploading...' : 'Upload Documents'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

