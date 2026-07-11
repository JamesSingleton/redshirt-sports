"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { useState } from "react";

interface NewsletterFormProps {
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  placeholder?: string;
  buttonLabel?: string;
}

export function NewsletterForm({
  className,
  inputClassName,
  buttonClassName,
  placeholder = "Enter your email",
  buttonLabel = "Sign up",
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Newsletter provider integration deferred to a later phase.
    setEmail("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex w-full flex-col gap-2 sm:flex-row", className)}
    >
      <Input
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={placeholder}
        className={cn("flex-1", inputClassName)}
        aria-label="Email address"
      />
      <Button type="submit" className={cn("shrink-0", buttonClassName)}>
        {buttonLabel}
      </Button>
    </form>
  );
}
