interface CollegeNewsPageShellProps {
  header: React.ReactNode;
  main: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function CollegeNewsPageShell({
  header,
  main,
  sidebar,
}: CollegeNewsPageShellProps) {
  return (
    <div className="container px-4 py-6">
      {header}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">{main}</div>
        {sidebar ? <div className="lg:col-span-4">{sidebar}</div> : null}
      </div>
    </div>
  );
}
