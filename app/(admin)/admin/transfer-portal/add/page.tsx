import { ImageIcon } from 'lucide-react'

import { Label } from '@components/ui/label'
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectGroup,
  SelectContent,
  Select,
} from '@components/ui/select'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'

import TransferPortalForm from './TransferPortalForm'

export default function AddTransferPortalPlayerPage() {
  return (
    <div className="mx-auto max-w-[600px] space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Enter Transfer Portal</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Select an existing player or enter the player&apos;s details who is entering the transfer
          portal
        </p>
      </div>
      <TransferPortalForm />
    </div>
  )
}
