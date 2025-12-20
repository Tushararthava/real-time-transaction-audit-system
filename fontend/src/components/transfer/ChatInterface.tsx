import { useCallback, useMemo, useState, useEffect } from 'react';
import { User } from '@/types/transaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, ArrowDown, ArrowUp, Loader2, Lock, IndianRupee, MessageSquare } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { useTransactions } from '@/features/history/api';
import { useCreateTransfer } from '@/features/transfer/api';
import { useUserStore } from '@/store/user.store';
import { getAvatarUrl } from '@/lib/avatar';

interface ChatInterfaceProps {
    recipient: User;
    onBack: () => void;
    autoOpenPaymentModal?: boolean;
}

export function ChatInterface({ recipient, onBack, autoOpenPaymentModal = false }: ChatInterfaceProps) {
    const { user } = useUserStore();
    const { data: allTransactions, isLoading: loadingTransactions } = useTransactions();
    const { mutate: sendMoney, isPending: isSending } = useCreateTransfer();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    // Auto-open payment modal when coming from QR scan
    useEffect(() => {
        if (autoOpenPaymentModal) {
            setShowPaymentModal(true);
        }
    }, [autoOpenPaymentModal]);

    // Memoize recipient initials
    const recipientInitials = useMemo(() => {
        return recipient.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }, [recipient.name]);

    // Filter and map transactions to messages
    const messages = useMemo(() => {
        if (!allTransactions || !user) return [];

        return allTransactions
            .filter(tx =>
                (tx.senderId === user.id && tx.receiverId === recipient.id) ||
                (tx.senderId === recipient.id && tx.receiverId === user.id)
            )
            .map(tx => ({
                id: tx.id,
                type: (tx.senderId === user.id ? 'sent' : 'received') as 'sent' | 'received',
                amount: tx.amount,
                description: tx.description || undefined,
                timestamp: tx.createdAt
            }))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [allTransactions, user, recipient.id]);

    // Send money via real API
    const onSendMoney = useCallback((data: any) => {
        console.log('Form data:', data); // DEBUG
        console.log('UPI PIN value:', data.upiPin); // DEBUG

        const amountInCents = Math.round(parseFloat(data.amount) * 100);

        if (isNaN(amountInCents) || amountInCents <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!data.upiPin || data.upiPin.length < 4) {
            alert('Please enter a valid UPI PIN');
            return;
        }

        console.log('Sending transfer with PIN:', data.upiPin); // DEBUG
        console.log('PIN type:', typeof data.upiPin); // DEBUG

        sendMoney({
            receiverId: recipient.id,
            amount: amountInCents,
            description: data.note || '',
            upiPin: String(data.upiPin) // Ensure it's a string
        }, {
            onSuccess: () => {
                setShowPaymentModal(false);
                reset();
                console.log('Transfer successful!');
            },
            onError: (error: any) => {
                console.error('Transfer failed:', error);
                const errorMessage = error?.response?.data?.message || 'Transfer failed. Please try again.';
                alert(errorMessage);
            }
        });
    }, [recipient.id, sendMoney, reset]);

    return (
        <>
            <Card className="bg-white shadow-sm h-[600px] flex flex-col">
                {/* Header */}
                <CardHeader className="border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onBack}
                            className="p-2 hover:bg-gray-200"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                            <AvatarImage src={getAvatarUrl(recipient.id, recipient.avatar)} />
                            <AvatarFallback className="bg-blue-50 text-primary font-semibold">
                                {recipientInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-base">{recipient.name}</CardTitle>
                            <p className="text-xs text-gray-500">{recipient.email}</p>
                        </div>
                    </div>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {loadingTransactions ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p className="text-sm">No transactions yet. Start by sending money!</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs p-4 rounded-2xl ${message.type === 'sent'
                                        ? 'bg-primary text-white'
                                        : 'bg-white border border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {message.type === 'sent' ? (
                                            <ArrowUp className="w-4 h-4" />
                                        ) : (
                                            <ArrowDown className="w-4 h-4" />
                                        )}
                                        <span className="font-bold text-lg">
                                            {formatCurrency(message.amount)}
                                        </span>
                                    </div>
                                    {message.description && (
                                        <p className="text-sm opacity-90">{message.description}</p>
                                    )}
                                    <p className={`text-xs mt-2 ${message.type === 'sent' ? 'text-white/70' : 'text-gray-500'}`}>
                                        {new Date(message.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>

                {/* Pay Button */}
                <div className="p-4 border-t bg-white">
                    <Button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full flex items-center justify-center gap-2 h-12 text-base font-semibold"
                        disabled={isSending}
                    >
                        <Send className="w-5 h-5" />
                        Pay {recipient.name.split(' ')[0]}
                    </Button>
                </div>
            </Card>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b">
                            <div className="flex items-center gap-3 mb-2">
                                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                                    <AvatarImage src={getAvatarUrl(recipient.id, recipient.avatar)} />
                                    <AvatarFallback className="bg-blue-50 text-primary font-semibold">
                                        {recipientInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Pay {recipient.name}</h2>
                                    <p className="text-sm text-gray-500">{recipient.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <form onSubmit={handleSubmit(onSendMoney)} className="p-6 space-y-5">
                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <IndianRupee className="w-4 h-4 inline mr-1" />
                                    Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0.01"
                                        {...register('amount', { required: true, min: 0.01 })}
                                        className="text-2xl font-bold h-16 pl-12 text-center"
                                        autoFocus
                                        disabled={isSending}
                                    />
                                </div>
                                {errors.amount && (
                                    <p className="text-xs text-red-500 mt-1">Please enter a valid amount</p>
                                )}
                            </div>

                            {/* UPI PIN */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Lock className="w-4 h-4 inline mr-1" />
                                    UPI PIN
                                </label>
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    placeholder="Enter 4-6 digit UPI PIN"
                                    maxLength={6}
                                    {...register('upiPin', {
                                        required: true,
                                        minLength: 4,
                                        pattern: /^\d{4,6}$/,
                                        setValueAs: (value) => String(value || '') // Ensure string type
                                    })}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        e.target.value = value;
                                    }}
                                    className="text-center text-2xl tracking-widest font-bold h-14"
                                    disabled={isSending}
                                />
                                {errors.upiPin && (
                                    <p className="text-xs text-red-500 mt-1">Please enter your UPI PIN</p>
                                )}
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <MessageSquare className="w-4 h-4 inline mr-1" />
                                    Add Note (Optional)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="What's this payment for?"
                                    {...register('note')}
                                    className="h-12"
                                    disabled={isSending}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        reset();
                                    }}
                                    disabled={isSending}
                                    className="flex-1 h-12"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSending}
                                    className="flex-1 h-12 bg-primary hover:bg-primary/90"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 mr-2" />
                                            Pay Now
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
