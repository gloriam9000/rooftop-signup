import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function SetTestUser() {
  const router = useRouter()

  useEffect(() => {
    // Set a test user cookie
    document.cookie = 'temp_user_id=test-user-123; path=/'
    
    // Redirect to dashboard after setting cookie
    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up test user session...</p>
        <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
