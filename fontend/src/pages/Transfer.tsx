import { useState, useCallback } from 'react';
import { QrScanner } from '@/components/transfer/QrScanner';
import { RecentPayees } from '@/components/transfer/RecentPayees';
import { UserSearch } from '@/components/transfer/UserSearch';
import { ChatInterface } from '@/components/transfer/ChatInterface';
import { Analytics } from '@/components/stats/Analytics';
import { User } from '@/types/transaction';
import { Card } from '@/components/ui/card';
import { QrCode, Phone, Users, BarChart3 } from 'lucide-react';

type TransferMode = 'qr' | 'phone' | 'recent' | 'stats';

export function Transfer() {
    const [selectedMode, setSelectedMode] = useState<TransferMode>('phone');
    const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);

    // Memoize callbacks to prevent unnecessary re-renders
    const handlePayeeSelect = useCallback((user: User) => {
        // Open chat for both "phone" and "recent" modes
        if (selectedMode === 'phone' || selectedMode === 'recent') {
            setSelectedRecipient(user);
        }
    }, [selectedMode]);

    const handleBackToSearch = useCallback(() => {
        setSelectedRecipient(null);
    }, []);

    const transferModes = [
        { id: 'qr' as TransferMode, label: 'Scan QR', icon: QrCode },
        { id: 'phone' as TransferMode, label: 'To Contact', icon: Phone },
        { id: 'recent' as TransferMode, label: 'Recent', icon: Users },
        { id: 'stats' as TransferMode, label: 'Stats', icon: BarChart3 },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Transfer Mode Categories */}
                <Card className="p-6 mb-6 bg-white shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {transferModes.map((mode) => {
                            const Icon = mode.icon;
                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => {
                                        setSelectedMode(mode.id);
                                        setSelectedRecipient(null);
                                    }}
                                    className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all ${selectedMode === mode.id
                                        ? 'bg-primary text-white shadow-lg scale-105'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <Icon className="w-8 h-8" />
                                    <span className="text-sm font-medium text-center">{mode.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                {/* Transfer Content Based on Mode */}
                <div className="space-y-6">
                    {selectedMode === 'qr' && (
                        <>
                            {!selectedRecipient ? (
                                <QrScanner
                                    onUserScanned={(scannedUser) => {
                                        // When QR is scanned, set the recipient and it will auto-open payment
                                        setSelectedRecipient(scannedUser);
                                    }}
                                />
                            ) : (
                                <ChatInterface
                                    recipient={selectedRecipient}
                                    onBack={handleBackToSearch}
                                    autoOpenPaymentModal={true}
                                />
                            )}
                        </>
                    )}

                    {selectedMode === 'phone' && (
                        <>
                            {!selectedRecipient ? (
                                <Card className="p-6 bg-white shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Search Contact</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Find the person you want to send money to
                                    </p>
                                    <UserSearch
                                        onSelect={handlePayeeSelect}
                                        selectedUser={null}
                                    />

                                    {/* Recent Payees for quick access */}
                                    <div className="mt-6">
                                        <RecentPayees onSelect={handlePayeeSelect} />
                                    </div>
                                </Card>
                            ) : (
                                <ChatInterface
                                    recipient={selectedRecipient}
                                    onBack={handleBackToSearch}
                                />
                            )}
                        </>
                    )}

                    {selectedMode === 'recent' && (
                        <>
                            {!selectedRecipient ? (
                                <Card className="p-6 bg-white shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Transactions</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Click on anyone to send or receive money
                                    </p>
                                    <RecentPayees onSelect={handlePayeeSelect} />
                                </Card>
                            ) : (
                                <ChatInterface
                                    recipient={selectedRecipient}
                                    onBack={handleBackToSearch}
                                />
                            )}
                        </>
                    )}

                    {selectedMode === 'stats' && (
                        <Analytics />
                    )}
                </div>
            </div>
        </div>
    );
}
