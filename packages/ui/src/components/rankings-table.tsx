import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";

export function MovementIndicator({ movement }: { movement: number | "new" }) {
  if (movement === "new") {
    return <span className="text-new">New</span>;
  }
  if (movement > 0) {
    return <span className="text-up">Up {movement}</span>;
  }
  if (movement < 0) {
    return <span className="text-down">Down {Math.abs(movement)}</span>;
  }
  return <span className="text-muted-foreground">Unchanged</span>;
}

export type RankRowData = {
  rank: number;
  name: string;
  points: number;
  movement: number | "new";
};

export function RankRow({ row }: { row: RankRowData }) {
  return (
    <TableRow>
      <TableCell className="tabular font-medium">{row.rank}</TableCell>
      <TableCell>{row.name}</TableCell>
      <TableCell className="tabular">{row.points}</TableCell>
      <TableCell>
        <MovementIndicator movement={row.movement} />
      </TableCell>
    </TableRow>
  );
}

export function RankingsTable({ rows }: { rows: RankRowData[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>Movement</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <RankRow key={row.rank} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}
