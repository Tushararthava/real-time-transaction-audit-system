import { useState } from 'react';
import { User } from '@/types/transaction';
import { useSearchUsers } from '@/features/transfer/api';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserStore } from '@/store/user.store';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/avatar';

interface UserSearchProps {
    onSelect: (user: User) => void;
    selectedUser: User | null;
}

export function UserSearch({ onSelect, selectedUser }: UserSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const { user: currentUser } = useUserStore();

    const { data: users = [], isLoading } = useSearchUsers(debouncedQuery);

    // Filter out current user
    const filteredUsers = users.filter(u => u.id !== currentUser?.id);

    const handleSelect = (user: User) => {
        onSelect(user);
        setQuery(user.name);
        setIsOpen(false);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="relative">
            <Input
                type="text"
                placeholder="Search by name or ID..."
                value={selectedUser ? selectedUser.name : query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                    if (selectedUser) onSelect(null as unknown as User);
                }}
                onFocus={() => setIsOpen(true)}
                className="w-full"
            />

            {isOpen && query.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Searching...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No users found
                        </div>
                    ) : (
                        <div>
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelect(user)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left",
                                        "focus:bg-accent focus:outline-none"
                                    )}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={getAvatarUrl(user.id, user.avatar)} alt={user.name} />
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{user.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
