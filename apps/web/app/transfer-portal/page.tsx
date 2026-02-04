import { Metadata } from 'next'
import { TransferPortalHeader } from '@/components/transfer-portal/transfer-portal-header'
import { TransferPortalContent } from '@/components/transfer-portal/transfer-portal-content'

export const metadata: Metadata = {
  title: 'College Football Transfer Portal | Redshirt Sports',
  description:
    'Track college football transfer portal entries, commitments, and withdrawals. Real-time updates on player movements, ratings, and team destinations.',
}

export default function TransferPortalPage() {
  return (
    <>
      <TransferPortalHeader />
      <TransferPortalContent />
    </>
  )
}
