import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppIconProps {
  className?: string;
  size?: number;
}

export function AppIcon({ className, size = 32 }: AppIconProps) {
  return (
    <Image
      src="/img/logo.png"
      alt="STSPoint Logo"
      width={size}
      height={size}
      className={cn("object-contain transition-transform duration-300 group-hover:scale-110", className)}
      priority
    />
  );
}
