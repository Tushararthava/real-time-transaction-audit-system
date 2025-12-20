import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Wallet } from 'lucide-react';

export function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [initialBalance, setInitialBalance] = useState('0');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [upiPin, setUpiPin] = useState('');
    const [confirmUpiPin, setConfirmUpiPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        // Validate UPI PIN
        if (!/^\d{4,6}$/.test(upiPin)) {
            alert('UPI PIN must be 4-6 digits');
            return;
        }

        if (upiPin !== confirmUpiPin) {
            alert('UPI PINs do not match!');
            return;
        }

        // Validate balance
        const balanceInCents = Math.round(parseFloat(initialBalance) * 100);
        if (isNaN(balanceInCents) || balanceInCents < 0) {
            alert('Please enter a valid initial balance');
            return;
        }

        setIsLoading(true);

        try {
            await signup({ email, password, name, initialBalance: balanceInCents, upiPin });
            console.log('Signup successful!');
        } catch (error: any) {
            console.error('Signup error:', error);
            const errorMessage = error?.response?.data?.message || 'Signup failed. Please try again.';
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">
                        Create Account
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600">
                        Join PayApp for fast and secure payments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
                            <Input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                            <Input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Initial Balance</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={initialBalance}
                                    onChange={(e) => setInitialBalance(e.target.value)}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="bg-white pl-7"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Starting wallet balance (minimum $0.00)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Must be 8+ characters with numbers and special characters
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Confirm Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                className="bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Set UPI PIN (4-6 digits)</label>
                            <Input
                                type="password"
                                placeholder="••••"
                                value={upiPin}
                                onChange={(e) => setUpiPin(e.target.value.replace(/\D/g, ''))}
                                required
                                pattern="\d{4,6}"
                                maxLength={6}
                                className="bg-white text-center text-2xl tracking-widest font-bold"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Required for secure payments
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Confirm UPI PIN</label>
                            <Input
                                type="password"
                                placeholder="••••"
                                value={confirmUpiPin}
                                onChange={(e) => setConfirmUpiPin(e.target.value.replace(/\D/g, ''))}
                                required
                                maxLength={6}
                                className="bg-white text-center text-2xl tracking-widest font-bold"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </Button>

                        <div className="text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
