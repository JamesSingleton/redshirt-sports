'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@components/ui/Button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form'
import { Input } from '@components/ui/Input'
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectGroup,
  SelectContent,
  Select,
} from '@components/ui/select'

const formSchema = z.object({
  existingAthlete: z.string().optional(),
  athleteName: z.string().min(1, "Please provide the athlete's name"),
  currentCollege: z.string().nonempty("Please select the athlete's current college"),
  position: z.string({
    required_error: "Please select the athlete's position",
  }),
  status: z.string().min(1, "Please specify the athlete's transfer status"),
  height: z.number().min(0, 'Please provide a valid height'),
  weight: z.number().min(0, 'Please provide a valid weight'),
  playerYear: z.string().min(1, "Please specify the athlete's year"),
  highSchool: z.string().min(1, "Please provide the athlete's high school"),
  hometown: z.string().min(1, "Please provide the athlete's hometown"),
  state: z.string().nonempty("Please select the athlete's state"),
  playerHeadshot: z.string().min(1, 'Please provide a player headshot'),
})

export default function TransferPortalForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      existingAthlete: '',
      athleteName: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="existingAthlete"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existing Player</FormLabel>
              <FormControl>
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
              </FormControl>
              <FormDescription>
                Select an existing player (if they have entered the portal before).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="athleteName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player Name</FormLabel>
              <FormControl>
                <Input {...field} id="player-name" placeholder="John Doe" />
              </FormControl>
              <FormDescription>
                The name of the player entering the transfer portal.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currentCollege"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current College</FormLabel>
              <FormControl>
                <Input {...field} id="current-college" placeholder="University A" />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <FormControl>
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
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
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
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player Height</FormLabel>
              <FormControl>
                <Input {...field} id="player-height" placeholder="6' 2&quot;" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player Weight</FormLabel>
              <FormControl>
                <Input {...field} id="player-height" placeholder="200 lbs" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="playerYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player Year</FormLabel>
              <FormControl>
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
              </FormControl>
              <FormDescription>
                Is the player a freshman, redshirt sophomore, junior, senior etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* input for player's high school and home town and state */}

        <FormField
          control={form.control}
          name="highSchool"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player High School</FormLabel>
              <FormControl>
                <Input {...field} id="player-high-school" placeholder="High School Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* put a input for hometown and a dropdown for state side by side */}
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="hometown"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hometown</FormLabel>
                <FormControl>
                  <Input {...field} id="player-hometown" placeholder="Hometown" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="alabama">Alabama</SelectItem>
                        <SelectItem value="alaska">Alaska</SelectItem>
                        <SelectItem value="arizona">Arizona</SelectItem>
                        <SelectItem value="arkansas">Arkansas</SelectItem>
                        <SelectItem value="california">California</SelectItem>
                        <SelectItem value="colorado">Colorado</SelectItem>
                        <SelectItem value="connecticut">Connecticut</SelectItem>
                        <SelectItem value="delaware">Delaware</SelectItem>
                        <SelectItem value="florida">Florida</SelectItem>
                        <SelectItem value="georgia">Georgia</SelectItem>
                        <SelectItem value="hawaii">Hawaii</SelectItem>
                        <SelectItem value="idaho">Idaho</SelectItem>
                        <SelectItem value="illinois">Illinois</SelectItem>
                        <SelectItem value="indiana">Indiana</SelectItem>
                        <SelectItem value="iowa">Iowa</SelectItem>
                        <SelectItem value="kansas">Kansas</SelectItem>
                        <SelectItem value="kentucky">Kentucky</SelectItem>
                        <SelectItem value="louisiana">Louisiana</SelectItem>
                        <SelectItem value="maine">Maine</SelectItem>
                        <SelectItem value="maryland">Maryland</SelectItem>
                        <SelectItem value="massachusetts">Massachusetts</SelectItem>
                        <SelectItem value="michigan">Michigan</SelectItem>
                        <SelectItem value="minnesota">Minnesota</SelectItem>
                        <SelectItem value="mississippi">Mississippi</SelectItem>
                        <SelectItem value="missouri">Missouri</SelectItem>
                        <SelectItem value="montana">Montana</SelectItem>
                        <SelectItem value="nebraska">Nebraska</SelectItem>
                        <SelectItem value="nevada">Nevada</SelectItem>
                        <SelectItem value="new-hampshire">New Hampshire</SelectItem>
                        <SelectItem value="new-jersey">New Jersey</SelectItem>
                        <SelectItem value="new-mexico">New Mexico</SelectItem>
                        <SelectItem value="new-york">New York</SelectItem>
                        <SelectItem value="north-carolina">North Carolina</SelectItem>
                        <SelectItem value="north-dakota">North Dakota</SelectItem>
                        <SelectItem value="ohio">Ohio</SelectItem>
                        <SelectItem value="oklahoma">Oklahoma</SelectItem>
                        <SelectItem value="oregon">Oregon</SelectItem>
                        <SelectItem value="pennsylvania">Pennsylvania</SelectItem>
                        <SelectItem value="rhode-island">Rhode Island</SelectItem>
                        <SelectItem value="south-carolina">South Carolina</SelectItem>
                        <SelectItem value="south-dakota">South Dakota</SelectItem>
                        <SelectItem value="tennessee">Tennessee</SelectItem>
                        <SelectItem value="texas">Texas</SelectItem>
                        <SelectItem value="utah">Utah</SelectItem>
                        <SelectItem value="vermont">Vermont</SelectItem>
                        <SelectItem value="virginia">Virginia</SelectItem>
                        <SelectItem value="washington">Washington</SelectItem>
                        <SelectItem value="west-virginia">West Virginia</SelectItem>
                        <SelectItem value="wisconsin">Wisconsin</SelectItem>
                        <SelectItem value="wyoming">Wyoming</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="playerHeadshot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player Headshot</FormLabel>
              <FormControl>
                <Input {...field} accept="image/*" id="player-headshot" type="file" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
