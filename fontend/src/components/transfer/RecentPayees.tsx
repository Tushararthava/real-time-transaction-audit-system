import { memo, useMemo } from 'react';
import { useRecentPayees } from '@/features/recent-payees/api';
import { User } from '@/types/transaction';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/avatar';

interface RecentPayeesProps {
    onSelect: (user: User) => void;
}

// Memoize individual payee card to prevent unnecessary re-renders
const PayeeCard = memo(function PayeeCard({
    id,
    name,
    avatar,
    onClick
}: {
    id: string;
    name: string;
    avatar: string | null;
    onClick: () => void;
}) {
    const initials = useMemo(() => {
        return name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }, [name]);

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-2 min-w-[90px] p-3 rounded-xl",
                "hover:bg-gray-50 transition-all group"
            )}
        >
            <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <AvatarImage src={getAvatarUrl(id, avatar)} alt={name} />
                <AvatarFallback className="text-xs bg-blue-50 text-primary font-semibold">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <p className="text-xs font-medium text-center truncate w-full text-gray-700">
                {name.split(' ')[0]}
            </p>
        </button>
    );
});

export function RecentPayees({ onSelect }: RecentPayeesProps) {
    const { data: payees = [], isLoading } = useRecentPayees();

    if (isLoading) {
        return (
            <Card className="bg-white shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">Recent</CardTitle>
                    <CardDescription className="text-gray-600">Loading...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (payees.length === 0) {
        return null;
    }

    return (
        <Card className="bg-white shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg text-gray-900">Recent Contacts</CardTitle>
                <CardDescription className="text-gray-600">Pay again to these people</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {payees.map((payee) => (
                        <PayeeCard
                            key={payee.user.id}
                            id={payee.user.id}
                            name={payee.user.name}
                            avatar={payee.user.avatar}
                            onClick={() => onSelect(payee.user)}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
