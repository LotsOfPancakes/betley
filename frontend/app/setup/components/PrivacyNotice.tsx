// frontend/app/setup/components/PrivacyNotice.tsx
'use client'

export default function PrivacyNotice() {
  return (
    <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
      <h3 className="text-blue-300 font-semibold mb-2">🔒 Privacy Protection</h3>
      <p className="text-blue-200 text-sm">
        Your bet will be assigned a unique, random 8-character ID for privacy. 
        Only people with the direct link will be able to access your bet.
      </p>
    </div>
  )
}