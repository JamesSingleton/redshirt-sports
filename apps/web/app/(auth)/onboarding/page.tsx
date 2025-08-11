import { Suspense } from 'react'
import Onboarding from '@/components/forms/onboarding'

export default async function OnboardingPage() {
  return (
    <div className="container flex items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <Onboarding />
      </Suspense>
    </div>
  )
}
