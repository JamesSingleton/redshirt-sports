import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithClassName<P> = Omit<P, "className"> & { className?: string };

export function whenSelected<T>(handler: (value: T) => void) {
  return (value: T | null) => {
    if (value !== null) handler(value);
  };
}
