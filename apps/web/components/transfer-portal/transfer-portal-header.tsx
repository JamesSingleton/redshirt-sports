import Link from 'next/link'

export function TransferPortalHeader() {
  return (
    <div className="border-b bg-white">
      <div className="container">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link href="/transfer-portal" className="text-lg font-bold tracking-wider text-[#FF4500]">
              TRANSFER PORTAL
            </Link>
            <nav className="flex items-center space-x-6 text-sm">
              <Link href="/transfer-portal/news" className="text-gray-600 hover:text-[#FF4500]">
                News
              </Link>
              <Link href="/transfer-portal" className="font-medium text-[#FF4500]">
                NCAA Transfer Portal
              </Link>
              <Link
                href="/transfer-portal/player-rankings"
                className="text-gray-600 hover:text-[#FF4500]"
              >
                Player Rankings
              </Link>
              <Link
                href="/transfer-portal/team-rankings"
                className="text-gray-600 hover:text-[#FF4500]"
              >
                Team Rankings
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
