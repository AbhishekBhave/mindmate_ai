import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              MindMate AI
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Your personal journal companion
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
