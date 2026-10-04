/** Joins class names, skipping empty values: cn('a', isOn && 'b') */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'inverse';
type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-teal text-cream hover:bg-teal/90',
  secondary: 'border border-teal/25 bg-cream text-teal hover:bg-tea/70',
  ghost: 'text-teal hover:bg-teal/10',
  accent: 'bg-celadon text-teal hover:bg-celadon/80',
  inverse: 'bg-cream text-teal hover:bg-tea',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

/** Button styles for <button>, <a> or next/link: className={buttonClass({ variant: 'secondary' })} */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition-colors [&>svg]:size-4',
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-60 disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  );
}
