'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import {
  Form,
  FormField,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@workspace/ui/components/card'
import { Input } from '@workspace/ui/components/input'

import { completeOnboarding } from '@/actions/complete-onboarding'

const FormSchema = z.object({
  organizationName: z.string().min(2, {
    message: 'Organization Name must be at least 2 characters',
  }),
  organizationRole: z.string().min(2, {
    message: 'Organization Role must be at least 2 characters',
  }),
})

export default function Onboarding() {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      organizationName: '',
      organizationRole: '',
    },
  })

  const handleSubmit = async (formData: FormData) => {
    const res = await completeOnboarding(formData)
    if (res?.error) {
      toast.error(res.error)
    }
    if (res?.message) {
      await user?.reload()
      toast.success('Onboarding completed successfully!')
      const redirectUrl = searchParams.get('redirect_url')
      if (redirectUrl) {
        router.push(redirectUrl)
      }
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>
          Please provide information about what organization you represent and your role and that
          organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form action={handleSubmit} className="grid gap-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your organization's name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Please provide the name of the organization you are representing.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organizationRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Role</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your job title or role" {...field} />
                  </FormControl>
                  <FormDescription>
                    Please provide your job title or role within the organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
