import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import Link from "next/link";

const sections = [
  {
    title: "Rankings",
    description: "Preview and finalize weekly Top 25 polls.",
    href: "/rankings",
  },
  {
    title: "Voters",
    description: "Manage voter poll assignments by sport and division.",
    href: "/voters",
  },
  {
    title: "Players",
    description: "Player data and recruiting tools.",
    href: "/players",
  },
  {
    title: "Transfer Portal",
    description: "Transfer portal operations.",
    href: "/transfer-portal",
  },
  {
    title: "Development",
    description: "Data loaders and development utilities.",
    href: "/development",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h2 className="text-2xl font-bold">Admin dashboard</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Operations tools for rankings, voters, and content data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="block">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
