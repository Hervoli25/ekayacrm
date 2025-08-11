
import nextDynamic from 'next/dynamic';

const ReceiptsPage = nextDynamic(() => import('./client-receipts'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

export const dynamic = 'force-dynamic';

export default function FinanceReceiptsPage() {
  return <ReceiptsPage />;
}
