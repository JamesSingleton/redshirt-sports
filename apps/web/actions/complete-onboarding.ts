"use server"
import { auth, clerkClient } from '@clerk/nextjs/server'

export const completeOnboarding = async (formData: FormData) => {
  const { userId } = await auth()

  if (!userId) {
    return { message: 'No Logged In User' }
  }

  try {
    const client = await clerkClient()

    const res = await client.users.updateUserMetadata(userId, {
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