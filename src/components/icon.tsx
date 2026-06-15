import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppIconProps {
  className?: string;
  size?: number;
}

export function AppIcon({ className, size = 32 }: AppIconProps) {
  return (
    <Image
      src="/logo.png"
      alt="STSPoint Logo"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority
    />
  );
}
