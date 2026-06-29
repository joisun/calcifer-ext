"use client";

import { cn } from "./utils/cn";

export type SpiralLoaderProps = {
  size?: number;
  className?: string;
};

export function SpiralLoader({ size = 16, className }: SpiralLoaderProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("an-spiral-loader relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-[12.5%] rounded-full bg-an-primary-color/20 blur-[1px]" />
      <span className="absolute inset-0 rounded-full border border-an-primary-color/20 border-t-an-primary-color" />
      <span className="absolute left-1/2 top-0 h-[22%] w-[22%] -translate-x-1/2 rounded-full bg-an-primary-color shadow-[0_0_10px_var(--an-primary-color)]" />
    </div>
  );
}
