import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ text = 'Loading...', size = 'md' }: LoadingProps) {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32
  };

  return (
    <div className="flex items-center justify-center gap-2 p-4">
      <Loader2 size={sizes[size]} className="animate-spin text-orange-500" />
      <span className="text-sm text-gray-400">{text}</span>
    </div>
  );
}
