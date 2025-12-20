import { Link, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/user.store';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Menu, X, Wallet } from 'lucide-react';
import { useState } from 'react';
import { getAvatarUrl } from '@/lib/avatar';

export function Navbar() {
    const { user, balance } = useUserStore();
    const { logout } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const navItems = [
        { path: '/', label: 'Pay' },
        { path: '/history', label: 'History' },
    ];

    return (
        <nav className="bg-[#1c1e24] text-white shadow-lg sticky top-0 z-50">
            <div className="container max-w-6xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">PayApp</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === item.path
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* User Section */}
                    {user && (
                        <div className="flex items-center gap-4">
                            {/* Balance */}
                            <div className="hidden sm:block text-right">
                                <p className="text-xs text-gray-400">Balance</p>
                                <p className="font-bold text-lg text-white">
                                    {balance ? formatCurrency(balance.amount) : '₹0'}
                                </p>
                            </div>

                            {/* Profile */}
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-white/20">
                                    <AvatarImage src={getAvatarUrl(user.id, user.avatar)} />
                                    <AvatarFallback className="bg-primary text-white font-semibold">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium text-white">{user.name}</p>
                                    <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={logout} className="hidden md:flex text-white hover:bg-white/10">
                                    Logout
                                </Button>
                                <button
                                    className="md:hidden text-white"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                >
                                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${location.pathname === item.path
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-300 hover:bg-white/5'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div className="px-4 py-3 bg-white/5 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Balance</p>
                            <p className="font-bold text-lg text-white">
                                {balance ? formatCurrency(balance.amount) : '₹0'}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={logout} className="w-full text-white border-white/20 hover:bg-white/10">
                            Logout
                        </Button>
                    </div>
                )}
            </div>
        </nav>
    );
}
