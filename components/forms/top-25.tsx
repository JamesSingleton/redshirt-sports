'use client'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import ImageComponent from '@/components/common/ImageComponent'

import type { Top25FormProps } from '@/types'

const formSchema = z
  .object({
    rank_1: z.string({
      required_error: 'Please select a team for rank 1.',
    }),
    rank_2: z.string({
      required_error: 'Please select a team for rank 2.',
    }),
    rank_3: z.string({
      required_error: 'Please select a team for rank 3.',
    }),
    rank_4: z.string({
      required_error: 'Please select a team for rank 4.',
    }),
    rank_5: z.string({
      required_error: 'Please select a team for rank 5.',
    }),
    rank_6: z.string({
      required_error: 'Please select a team for rank 6.',
    }),
    rank_7: z.string({
      required_error: 'Please select a team for rank 7.',
    }),
    rank_8: z.string({
      required_error: 'Please select a team for rank 8.',
    }),
    rank_9: z.string({
      required_error: 'Please select a team for rank 9.',
    }),
    rank_10: z.string({
      required_error: 'Please select a team for rank 10.',
    }),
    rank_11: z.string({
      required_error: 'Please select a team for rank 11.',
    }),
    rank_12: z.string({
      required_error: 'Please select a team for rank 12.',
    }),
    rank_13: z.string({
      required_error: 'Please select a team for rank 13.',
    }),
    rank_14: z.string({
      required_error: 'Please select a team for rank 14.',
    }),
    rank_15: z.string({
      required_error: 'Please select a team for rank 15.',
    }),
    rank_16: z.string({
      required_error: 'Please select a team for rank 16.',
    }),
    rank_17: z.string({
      required_error: 'Please select a team for rank 17.',
    }),
    rank_18: z.string({
      required_error: 'Please select a team for rank 18.',
    }),
    rank_19: z.string({
      required_error: 'Please select a team for rank 19.',
    }),
    rank_20: z.string({
      required_error: 'Please select a team for rank 20.',
    }),
    rank_21: z.string({
      required_error: 'Please select a team for rank 21.',
    }),
    rank_22: z.string({
      required_error: 'Please select a team for rank 22.',
    }),
    rank_23: z.string({
      required_error: 'Please select a team for rank 23.',
    }),
    rank_24: z.string({
      required_error: 'Please select a team for rank 24.',
    }),
    rank_25: z.string({
      required_error: 'Please select a team for rank 25.',
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

const Top25 = ({ schools, vote }: Top25FormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: vote,
  })
  const params = useParams()
  const router = useRouter()

  function onSubmit(values: z.infer<typeof formSchema>) {
    fetch('/api/vote', {
      method: 'POST',
      body: JSON.stringify(values),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => {
      if (res.ok) {
        router.push(`/vote/${params.division}/confirmation`)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {Array.from({ length: 25 }).map((_, index) => (
          <FormField
            key={index}
            control={form.control}
            // @ts-ignore
            name={`rank_${index + 1}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rank {index + 1}</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent ref={field.ref}>
                      <SelectGroup>
                        {schools.map((school) => (
                          <SelectItem key={school._id} value={school._id}>
                            <div className="flex items-center gap-4">
                              <ImageComponent
                                image={school.image}
                                alt={school.name}
                                width={32}
                                height={32}
                                mode="cover"
                                loading="lazy"
                                className="h-8 w-8"
                              />
                              <span>{school.shortName ?? school.abbreviation ?? school.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isValid}>
          Submit
        </Button>
      </form>
    </Form>
  )
}

export default Top25
