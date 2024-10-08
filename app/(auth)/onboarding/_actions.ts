'use server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export const completeOnboarding = async (formData: FormData) => {
  const { userId } = auth()

  if (!userId) {
    return { message: 'No Logged In User' }
  }

  try {
    const res = await clerkClient().users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingComplete: true,
        organization: formData.get('organizationName'),
        organizationRole: formData.get('organizationRole'),
      },
    })
    return { message: res.publicMetadata }
  } catch (error) {
    return { error: 'There was an error updating the user metadata.' }
  }
}
