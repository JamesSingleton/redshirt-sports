import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-react'

const positions = [
  'All',
  'QB',
  'RB',
  'WR',
  'TE',
  'OT',
  'IOL',
  'EDGE',
  'DL',
  'LB',
  'CB',
  'S',
  'ATH',
  'K',
  'P',
  'LS',
]
const divisions = ['All', 'FBS', 'FCS', 'D2', 'D3', 'NAIA']
const years = ['All', 'FR', 'SO', 'JR', 'SR']
const statuses = ['All', 'Entered', 'Withdrawn', 'Committed']
const schools = ['All', 'Springfield U', 'Oakville College', 'Rivertown State']

interface FiltersProps {
  positionFilter: string
  positions: {
    id: number
    name: string
    abbreviation: string
  }[]
  divisionFilter: string
  yearFilter: string
  statusFilter: string
  schoolFilter: string
  onFilterChange: (filters: Record<string, string>) => void
}

export function Filters({
  positionFilter,
  positions,
  divisionFilter,
  yearFilter,
  statusFilter,
  schoolFilter,
  onFilterChange,
}: FiltersProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ [key]: value })
  }

  const FilterSelect = ({
    label,
    value,
    onValueChange,
    options,
  }: {
    label: string
    value: string
    onValueChange: (value: string) => void
    options: string[]
  }) => (
    <div className="w-full">
      <Label htmlFor={label} className="mb-2 block text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={label} className="w-full">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const AdditionalFilters = () => (
    <>
      <FilterSelect
        label="Division"
        value={divisionFilter}
        onValueChange={(value) => handleFilterChange('division', value)}
        options={divisions}
      />
      <FilterSelect
        label="Year"
        value={yearFilter}
        onValueChange={(value) => handleFilterChange('year', value)}
        options={years}
      />
      <FilterSelect
        label="Status"
        value={statusFilter}
        onValueChange={(value) => handleFilterChange('status', value)}
        options={statuses}
      />
      <FilterSelect
        label="School"
        value={schoolFilter}
        onValueChange={(value) => handleFilterChange('school', value)}
        options={schools}
      />
    </>
  )

  return (
    <div className="mb-6">
      <div className="hidden gap-4 md:grid md:grid-cols-5">
        <FilterSelect
          label="Position"
          value={positionFilter}
          onValueChange={(value) => handleFilterChange('position', value)}
          options={['All', ...positions.map((position) => position.abbreviation)]}
        />
        <AdditionalFilters />
      </div>
      <div className="flex flex-col space-y-4 md:hidden">
        <div className="flex items-end justify-between">
          <div className="w-1/2 pr-2">
            <FilterSelect
              label="Position"
              value={positionFilter}
              onValueChange={(value) => handleFilterChange('position', value)}
              options={['All', ...positions.map((position) => position.abbreviation)]}
            />
          </div>
          <div className="flex w-1/2 justify-end pl-2">
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline">
                  <Filter className="size-4" />
                  <span className="sr-only">More Filters</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Filters</DrawerTitle>
                </DrawerHeader>
                <div className="space-y-4 p-4">
                  <AdditionalFilters />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </div>
  )
}
