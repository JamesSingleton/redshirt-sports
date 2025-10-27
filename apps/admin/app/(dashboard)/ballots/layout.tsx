import BallotsBreadcrumbs from './ballots-breadcrumbs'

export default function BallotsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full p-4">
      <BallotsBreadcrumbs />
      <div className="max-w-[600px] w-full flex justify-center mx-auto">{children}</div>
    </div>
  )
}
