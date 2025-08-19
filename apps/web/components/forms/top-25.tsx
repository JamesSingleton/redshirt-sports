'use client'

import { useMemo } from 'react'
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

import type { SchoolsByDivisionQueryResult } from '@/lib/sanity/sanity.types'

const formSchema = z
  .object({
    division: z.enum(['fbs', 'fcs', 'd2', 'd3', 'mid-major', 'power-conferences']).optional(),
    sport: z.string().optional(),
    rank_1: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 1.' : undefined,
    }),
    rank_2: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 2.' : undefined,
    }),
    rank_3: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 3.' : undefined,
    }),
    rank_4: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 4.' : undefined,
    }),
    rank_5: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 5.' : undefined,
    }),
    rank_6: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 6.' : undefined,
    }),
    rank_7: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 7.' : undefined,
    }),
    rank_8: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 8.' : undefined,
    }),
    rank_9: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 9.' : undefined,
    }),
    rank_10: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 10.' : undefined,
    }),
    rank_11: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 11.' : undefined,
    }),
    rank_12: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 12.' : undefined,
    }),
    rank_13: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 13.' : undefined,
    }),
    rank_14: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 14.' : undefined,
    }),
    rank_15: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 15.' : undefined,
    }),
    rank_16: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 16.' : undefined,
    }),
    rank_17: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 17.' : undefined,
    }),
    rank_18: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 18.' : undefined,
    }),
    rank_19: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 19.' : undefined,
    }),
    rank_20: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 20.' : undefined,
    }),
    rank_21: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 21.' : undefined,
    }),
    rank_22: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 22.' : undefined,
    }),
    rank_23: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 23.' : undefined,
    }),
    rank_24: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 24.' : undefined,
    }),
    rank_25: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please select a team for rank 25.' : undefined,
    }),
  })
  .superRefine((arg, ctx) => {
    // find which arg items are duplicates
    const duplicates: string[] = Object.entries(arg).reduce((acc: string[], [key, value]) => {
      if (Object.values(arg).filter((v) => v === value).length > 1) {
        acc.push(key)
      }
      return acc
    }, [])

    if (duplicates.length) {
      duplicates.forEach((key) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate team selected for rank ${key.split('_')[1]}`,
          path: ['rank_' + key.split('_')[1]],
        })
      })
    }
  })

const Top25 = ({ schools }: { schools: SchoolsByDivisionQueryResult }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })
  const formValues = form.watch()
  const selectedValues = useMemo(() => {
    return Object.values(formValues).filter(Boolean) as string[]
  }, [formValues])

  const params = useParams()
  const { sport, division } = params as {
    sport: string
    division?: 'fbs' | 'fcs' | 'd2' | 'd3' | 'mid-major' | 'power-conferences'
  }
  const router = useRouter()

  function onSubmit(values: z.infer<typeof formSchema>) {
    // update the values to include the division
    values = { ...values, division, sport }

    toast.promise(
      fetch(`/api/vote/college/${sport}/rankings/${division}`, {
        method: 'POST',
        body: JSON.stringify(values),
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
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto space-y-6">
        {Array.from({ length: 25 }).map((_, index) => (
          <FormField
            key={index}
            control={form.control}
            // @ts-expect-error zodResolver doesn't support this
            name={`rank_${index + 1}`}
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
        ))}
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
