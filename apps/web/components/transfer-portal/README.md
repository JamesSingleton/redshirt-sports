# Transfer Portal Feature

This directory contains components for the College Football Transfer Portal feature, inspired by ON3.com's design aesthetic.

## Components

### `transfer-portal-header.tsx`
Secondary navigation bar with Transfer Portal branding and links to related sections (News, NCAA Transfer Portal, Player Rankings, Team Rankings).

### `transfer-portal-content.tsx`
Main content component featuring:
- **Tabs**: TOP, TRANSFER PORTAL (active), RANKINGS
- **Filter Controls**: Team, Year, Sport, Status, Position dropdowns
- **Stats Summary**: Entry, commitment, and withdrawal statistics with visual indicators
- **Player Table**: Comprehensive data table displaying:
  - Player status
  - Player photo and information (name, year, height, weight, high school)
  - Position
  - Star ratings (primary and secondary)
  - NIL value indicators
  - Previous team logo
  - New team destination with arrow indicator
- **Pagination**: Multi-page navigation controls

## Design Features

### Color Scheme
- **Primary Accent**: `#FF4500` (ON3 Orange) - Used for branding, CTAs, and active states
- **Background**: `#F5F5F5` (Light Gray) - Clean, neutral canvas
- **Surface**: White cards with subtle shadows
- **Text**: Gray scale with proper hierarchy

### Typography
- **Headings**: Bold, large-scale typography for impact
- **Labels**: Uppercase, bold, tracked-out for emphasis
- **Data**: Clean, readable fonts with proper weight hierarchy

### Layout
- Responsive container with proper spacing
- Card-based design with subtle shadows
- Generous padding and whitespace
- Clear visual hierarchy

## Data Structure

Each player object includes:
```typescript
{
  id: number
  name: string
  status: 'Committed' | 'Entered' | 'Withdrawn'
  position: string
  year: string
  height: string
  weight: string
  highSchool: string
  rating: number
  ratingSecondary: number | null
  nilValue: string
  lastTeam: string
  lastTeamLogo: string
  newTeam: string
  newTeamLogo: string
  image: string | null
}
```

## Future Enhancements
- Connect to real data source/API
- Add real player photos
- Implement actual team logos
- Add sorting functionality
- Include advanced filtering options
- Add player detail pages
- Implement real-time updates
