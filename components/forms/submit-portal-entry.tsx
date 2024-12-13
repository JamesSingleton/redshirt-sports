'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  heightFeet: z.number().int().min(4).max(8),
  heightInches: z.number().int().min(0).max(11),
  weight: z.number().int().min(100).max(400),
  highSchool: z.string().max(100, 'High school name is too long').optional(),
  hometown: z.string().max(100, 'Hometown name is too long').optional(),
  state: z.string().max(50, 'State name is too long').optional(),
  country: z.string().min(1, 'Country is required').max(50, 'Country name is too long'),
  positionId: z.string().min(1, 'Position is required'),
  previousSchoolId: z.string().min(1, 'Previous school is required'),
  eligibilityYears: z.number().int().min(0).max(5).optional(),
  classYearId: z.string().min(1, 'Class year is required'),
  isGradTransfer: z.boolean().default(false),
  playerImage: z
    .any()
    .refine((files) => files?.length == 1, 'Image is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.',
    ),
})
