'use client'

import { useRef } from 'react'
import { Button } from '@redshirt-sports/ui/components/button'
import { CardHeader, CardTitle, CardContent, Card } from '@redshirt-sports/ui/components/card'
import Top25, { type Top25FormRef } from './forms/top-25'
import type { SchoolsBySportAndSubgroupingStringQueryResult } from '@redshirt-sports/sanity/types'
import CustomImage from './sanity-image'

import type { VoterBallotWithSchool } from '@/types/votes'

type VoteFormWrapperProps = {
  schools: SchoolsBySportAndSubgroupingStringQueryResult
  previousBallot?: VoterBallotWithSchool[]
}

export default function VoteFormWrapper({ schools, previousBallot }: VoteFormWrapperProps) {
  const formRef = useRef<Top25FormRef>(null)

  const handlePopulateForm = () => {
    formRef.current?.populateWithPreviousBallot()
  }

  return (
    <div className="flex flex-col gap-6 pt-4 lg:flex-row">
      {previousBallot && previousBallot.length > 0 && (
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Previous Ballot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePopulateForm}
              className="mb-4 w-full"
            >
              Use Previous Ballot
            </Button>
            <p className="text-muted-foreground mb-4 text-center text-sm">
              Click to populate the form with your previous ballot selections
            </p>
            {previousBallot.map((team, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-8 text-right font-bold">{index + 1}.</span>
                <div className="flex flex-grow items-center space-x-2">
                  <CustomImage
                    image={team.schoolImageUrl}
                    width={32}
                    height={32}
                    className="size-8"
                  />
                  <span>{team.schoolShortName}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>New Ballot Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <Top25 ref={formRef} schools={schools} previousBallot={previousBallot} />
        </CardContent>
      </Card>
    </div>
  )
}
