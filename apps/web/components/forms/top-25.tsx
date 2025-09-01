'use client'

import { useMemo, useCallback } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form'
import { VirtualizedCombobox } from '../virtualized-combobox'

import type { SchoolsBySportAndSubgroupingStringQueryResult } from '@/lib/sanity/sanity.types'

// Optimized form schema with better error messages
const formSchema = z
  .object({
    division: z.enum(['fbs', 'fcs', 'd2', 'd3', 'mid-major', 'power-conferences']).optional(),
    sport: z.string().optional(),
    rank_1: z.string().min(1, 'Please select a team for rank 1.'),
    rank_2: z.string().min(1, 'Please select a team for rank 2.'),
    rank_3: z.string().min(1, 'Please select a team for rank 3.'),
    rank_4: z.string().min(1, 'Please select a team for rank 4.'),
    rank_5: z.string().min(1, 'Please select a team for rank 5.'),
    rank_6: z.string().min(1, 'Please select a team for rank 6.'),
    rank_7: z.string().min(1, 'Please select a team for rank 7.'),
    rank_8: z.string().min(1, 'Please select a team for rank 8.'),
    rank_9: z.string().min(1, 'Please select a team for rank 9.'),
    rank_10: z.string().min(1, 'Please select a team for rank 10.'),
    rank_11: z.string().min(1, 'Please select a team for rank 11.'),
    rank_12: z.string().min(1, 'Please select a team for rank 12.'),
    rank_13: z.string().min(1, 'Please select a team for rank 13.'),
    rank_14: z.string().min(1, 'Please select a team for rank 14.'),
    rank_15: z.string().min(1, 'Please select a team for rank 15.'),
    rank_16: z.string().min(1, 'Please select a team for rank 16.'),
    rank_17: z.string().min(1, 'Please select a team for rank 17.'),
    rank_18: z.string().min(1, 'Please select a team for rank 18.'),
    rank_19: z.string().min(1, 'Please select a team for rank 19.'),
    rank_20: z.string().min(1, 'Please select a team for rank 20.'),
    rank_21: z.string().min(1, 'Please select a team for rank 21.'),
    rank_22: z.string().min(1, 'Please select a team for rank 22.'),
    rank_23: z.string().min(1, 'Please select a team for rank 23.'),
    rank_24: z.string().min(1, 'Please select a team for rank 24.'),
    rank_25: z.string().min(1, 'Please select a team for rank 25.'),
  })
  .superRefine((data, ctx) => {
    // Optimized duplicate detection
    const values = Object.values(data).filter(Boolean) as string[]
    const duplicates = values.filter((value, index) => values.indexOf(value) !== index)

    if (duplicates.length > 0) {
      // Find all ranks that have duplicate values
      Object.entries(data).forEach(([key, value]) => {
        if (duplicates.includes(value)) {
          const rankNumber = key.split('_')[1]
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate team selected for rank ${rankNumber}`,
            path: [key as keyof typeof data],
          })
        }
      })
    }
  })

const Top25 = ({ schools }: { schools: SchoolsBySportAndSubgroupingStringQueryResult }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Enable real-time validation
  })

  const formValues = form.watch()

  // Memoized selected values for better performance
  const selectedValues = useMemo(() => {
    return Object.values(formValues).filter(Boolean) as string[]
  }, [formValues])

  const params = useParams()
  const { sport, division } = params as {
    sport: string
    division?: 'fbs' | 'fcs' | 'd2' | 'd3' | 'mid-major' | 'power-conferences'
  }
  const router = useRouter()

  // Memoized submit handler to prevent unnecessary re-renders
  const onSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      // update the values to include the division
      const submitData = { ...values, division, sport }

      toast.promise(
        fetch(`/api/vote/college/${sport}/rankings/${division}`, {
          method: 'POST',
          body: JSON.stringify(submitData),
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`)
          }

          const data = await res.json()
          router.push(`/vote/college/${sport}/${division}/confirmation`)
          return data
        }),
        {
          loading: 'Submitting Ballot',
          success: (data) => data?.message || 'Ballot submitted successfully',
          error: (err) => err.message || 'An error occurred while submitting your ballot',
        },
      )
    },
    [sport, division, router],
  )

  // Memoized rank fields to prevent unnecessary re-renders
  const rankFields = useMemo(() => {
    return Array.from({ length: 25 }).map((_, index) => (
      <FormField
        key={index}
        control={form.control}
        name={`rank_${index + 1}` as keyof z.infer<typeof formSchema>}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Rank {index + 1}</FormLabel>
            <FormControl>
              <VirtualizedCombobox
                options={schools}
                onChange={field.onChange}
                selectedOptions={selectedValues}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ))
  }, [form.control, selectedValues, schools])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto space-y-6">
        {rankFields}
        <Button
          className="w-full"
          type="submit"
          disabled={form.formState.isSubmitting || !form.formState.isValid}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" size={16} /> Submitting Ballot
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </form>
    </Form>
  )
}

export default Top25
