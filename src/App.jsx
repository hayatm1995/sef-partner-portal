import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { DevRoleProvider } from '@/contexts/DevRoleContext'
import { RoleSelectionProvider } from '@/contexts/RoleSelectionContext'
import AppErrorBoundary from '@/components/error/AppErrorBoundary'

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RoleSelectionProvider>
          <DevRoleProvider>
            <AuthProvider>
              <Pages />
              <Toaster />
            </AuthProvider>
          </DevRoleProvider>
        </RoleSelectionProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}

export default App 