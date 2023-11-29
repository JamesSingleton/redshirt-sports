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
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="existing-player">Existing Player</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select a player" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="player1">John Doe</SelectItem>
                <SelectItem value="player2">Jane Doe</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="player-name">Player Name</Label>
          <Input id="player-name" placeholder="John Doe" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="current-college">Current College</Label>
          <Input id="current-college" placeholder="University A" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="quarterback">Quarterback</SelectItem>
                <SelectItem value="runningback">Running Back</SelectItem>
                <SelectItem value="widereceiver">Wide Receiver</SelectItem>
                <SelectItem value="tightend">Tight End</SelectItem>
                <SelectItem value="offensivelineman">Offensive Lineman</SelectItem>
                <SelectItem value="defensivelineman">Defensive Lineman</SelectItem>
                <SelectItem value="linebacker">Linebacker</SelectItem>
                <SelectItem value="cornerback">Cornerback</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="entered">Entered</SelectItem>
                <SelectItem value="committed">Committed</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="player-height">Player Height</Label>
          <Input id="player-height" placeholder='"6&apos;2"' />
          <div className="space-y-2">
            <Label htmlFor="player-weight">Player Weight</Label>
            <Input id="player-weight" placeholder="200 lbs" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="player-year">Player Year</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select player year" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="freshman">Freshman</SelectItem>
                  <SelectItem value="redshirt-freshman">Redshirt Freshman</SelectItem>
                  <SelectItem value="sophomore">Sophomore</SelectItem>
                  <SelectItem value="redshirt-sophomore">Redshirt Sophomore</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="redshirt-junior">Redshirt Junior</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="redshirt-senior">Redshirt Senior</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="high-school">High School</Label>
            <Input id="high-school" placeholder="High School Name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hometown">Hometown</Label>
            <Input id="hometown" placeholder="Hometown" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="player-headshot">Player Headshot</Label>
            <Input accept="image/*" id="player-headshot" required type="file" />
          </div>
          <Button className="w-full" type="submit">
            Submit
          </Button>
        </div>
        TransferPortalForm
      </div>
    </div>
  )
}
