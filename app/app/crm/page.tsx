import nextDynamic from 'next/dynamic';

const ClientCRMPage = nextDynamic(() => import('./client-crm'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="absolute inset-2 bg-white rounded-full"></div>
        </div>
        <p className="text-gray-600 font-medium animate-pulse">Loading CRM dashboard...</p>
      </div>
    </div>
  )
});

export const dynamic = 'force-dynamic';

export default function CRMPage() {
  return <ClientCRMPage />;
}