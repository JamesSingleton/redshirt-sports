'use client'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form'
import { Input } from '@components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select'
import ImageComponent from '@components/common/ImageComponent'

import type { Top25FormProps } from '@types'

const formSchema = z.object({
  rank_1: z.string(),
  rank_2: z.string(),
  rank_3: z.string(),
  rank_4: z.string(),
  rank_5: z.string(),
  rank_6: z.string(),
  rank_7: z.string(),
  rank_8: z.string(),
  rank_9: z.string(),
  rank_10: z.string(),
  rank_11: z.string(),
  rank_12: z.string(),
  rank_13: z.string(),
  rank_14: z.string(),
  rank_15: z.string(),
  rank_16: z.string(),
  rank_17: z.string(),
  rank_18: z.string(),
  rank_19: z.string(),
  rank_20: z.string(),
  rank_21: z.string(),
  rank_22: z.string(),
  rank_23: z.string(),
  rank_24: z.string(),
  rank_25: z.string(),
})

const Top25 = ({ schools }: Top25FormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
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
                                className="h-8 w-8 rounded-full"
                              />
                              <span>{school.name}</span>
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

export default Top25
