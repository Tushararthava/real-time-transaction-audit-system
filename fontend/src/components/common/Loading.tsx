import { cn } from '@/lib/utils';

interface LoadingProps {
    className?: string;
    text?: string;
}

export function Loading({ className, text = 'Loading...' }: LoadingProps) {
    return (
        <div className={cn('flex items-center justify-center gap-2', className)}>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="text-sm text-muted-foreground">{text}</span>
        </div>
    );
}
