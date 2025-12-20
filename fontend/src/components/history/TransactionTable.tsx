import { useState } from 'react';
import { useTransactions } from '@/features/history/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransactionRow } from './TransactionRow';

export function TransactionTable() {
    const { data: transactions = [], isLoading } = useTransactions();
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const sortedTransactions = [...transactions].sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1;

        if (sortBy === 'date') {
            return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
            return multiplier * (a.amount - b.amount);
        }
    });

    const toggleSort = (column: 'date' | 'amount') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <p className="text-muted-foreground">Loading transactions...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="text-6xl mb-4">💸</div>
                        <p className="text-lg font-medium mb-2">No transactions yet</p>
                        <p className="text-sm text-muted-foreground">
                            Start by sending money to someone
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead
                                    className="cursor-pointer hover:text-foreground"
                                    onClick={() => toggleSort('amount')}
                                >
                                    Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead
                                    className="text-right cursor-pointer hover:text-foreground"
                                    onClick={() => toggleSort('date')}
                                >
                                    Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTransactions.map((transaction) => (
                                <TransactionRow key={transaction.id} transaction={transaction} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
