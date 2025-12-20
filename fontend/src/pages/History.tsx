import { TransactionTable } from '@/components/history/TransactionTable';

export function History() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b pt-6 pb-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Transaction History</h1>
                    <p className="text-gray-600">View all your past transactions</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <TransactionTable />
            </div>
        </div>
    );
}
