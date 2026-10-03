import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@redshirt-sports/ui/components/input-group";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { SearchIcon } from "lucide-react";
import Form from "next/form";

export function HeaderSearch({
  className,
  defaultValue,
}: {
  className?: string;
  defaultValue?: string;
}) {
  return (
    <Form action="/search" role="search" className={cn("w-full", className)}>
      <InputGroup className="bg-background h-9">
        <InputGroupInput
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Search Redshirt Sports"
          aria-label="Search articles"
          autoComplete="off"
          required
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>
    </Form>
  );
}
