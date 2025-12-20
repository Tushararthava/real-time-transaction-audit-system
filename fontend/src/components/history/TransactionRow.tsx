import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { Transaction } from '@/types/transaction';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';
import { useUserStore } from '@/store/user.store';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { getAvatarUrl } from '@/lib/avatar';

interface TransactionRowProps {
    transaction: Transaction;
}

export const TransactionRow = memo(function TransactionRow({ transaction }: TransactionRowProps) {
    const { user: currentUser } = useUserStore();
    const isDebit = transaction.senderId === currentUser?.id;
    const otherUser = isDebit ? transaction.receiver : transaction.sender;

    // Memoize expensive computations
    const formattedDate = useMemo(
        () => format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm'),
        [transaction.createdAt]
    );

    const otherUserInitials = useMemo(() => {
        const name = otherUser?.name || 'Unknown';
        return name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }, [otherUser?.name]);

    return (
        <TableRow className="hover:bg-gray-50">
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={getAvatarUrl(otherUser?.id || '', otherUser?.avatar)} />
                        <AvatarFallback className="bg-blue-50 text-primary font-semibold">
                            {otherUserInitials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium text-gray-900">{otherUser?.name || 'Unknown'}</p>
                        {transaction.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                {transaction.description}
                            </p>
                        )}
                    </div>
                </div>
            </TableCell>

            <TableCell>
                <div className="flex items-center gap-2">
                    {isDebit ? (
                        <ArrowUpRight className="w-4 h-4 text-red-500" />
                    ) : (
                        <ArrowDownLeft className="w-4 h-4 text-green-500" />
                    )}
                    <span className={isDebit ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                        {isDebit ? '-' : '+'} {formatCurrency(transaction.amount)}
                    </span>
                </div>
            </TableCell>

            <TableCell>
                <Badge variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}>
                    {transaction.status}
                </Badge>
            </TableCell>

            <TableCell className="text-gray-600">{formattedDate}</TableCell>
        </TableRow>
    );
});
