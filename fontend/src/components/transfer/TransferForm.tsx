import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transferSchema, type TransferFormData } from '@/schemas/transfer.schema';
import { useCreateTransfer } from '@/features/transfer/api';
import { User } from '@/types/transaction';
import { UserSearch } from './UserSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';

export function TransferForm() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const createTransferMutation = useCreateTransfer();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<TransferFormData>({
        resolver: zodResolver(transferSchema),
    });

    const handleUserSelect = (user: User | null) => {
        setSelectedUser(user);
        if (user) {
            setValue('receiverId', user.id);
        }
    };

    const onSubmit = async (data: TransferFormData) => {
        try {
            await createTransferMutation.mutateAsync(data);
            reset();
            setSelectedUser(null);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Transfer failed:', error);
        }
    };

    return (
        <Card className="bg-white shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Send className="w-5 h-5 text-primary" />
                    Send to Contact
                </CardTitle>
                <CardDescription className="text-gray-600">Transfer money to anyone instantly</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Search Recipient
                        </label>
                        <UserSearch
                            onSelect={handleUserSelect}
                            selectedUser={selectedUser}
                        />
                        {errors.receiverId && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <p>{errors.receiverId.message}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Amount (₹)
                        </label>
                        <Input
                            type="number"
                            placeholder="0"
                            {...register('amount', { valueAsNumber: true })}
                            className="text-2xl font-bold h-14 bg-white border-gray-300"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Enter amount in rupees (whole numbers only)
                        </p>
                        {errors.amount && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <p>{errors.amount.message}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Note (Optional)
                        </label>
                        <Input
                            type="text"
                            placeholder="What's this for?"
                            {...register('description')}
                            className="bg-white border-gray-300"
                        />
                    </div>

                    {showSuccess && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                            <CheckCircle className="w-5 h-5" />
                            <p className="text-sm font-medium">Transfer successful!</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                        disabled={createTransferMutation.isPending}
                    >
                        {createTransferMutation.isPending ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Send className="w-5 h-5" />
                                Send Money
                            </span>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
