import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--green)] text-white hover:bg-[var(--green-dark)] shadow-sm",
        navy: "bg-[var(--navy)] text-white hover:bg-[var(--navy-2)]",
        gold: "bg-[var(--gold)] text-[var(--navy)] hover:bg-[#d4af37]",
        outline:
          "border border-[var(--line)] bg-white text-[var(--navy)] hover:bg-[var(--cream)]",
        ghost: "text-[var(--navy)] hover:bg-[var(--cream)]",
        danger: "bg-[#9b2335] text-white hover:bg-[#7d1b2a]",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
