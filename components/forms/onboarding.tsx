'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { completeOnboarding } from '@/app/(auth)/onboarding/_actions'
import {
  Form,
  FormField,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      organizationName: '',
      organizationRole: '',
    },
  })

  const handleSubmit = async (formData: FormData) => {
    const res = await completeOnboarding(formData)
    if (res?.message) {
      await user?.reload()
      router.push('/vote/fcs')
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
