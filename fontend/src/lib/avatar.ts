
export function generateAvatar(seed: string, style: 'avataaars' | 'bottts' | 'initicon' | 'pixel-art' | 'fun-emoji' = 'avataaars'): string {
    // Use DiceBear API v7 - free
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}


export function getAvatarUrl(userId: string, userAvatar?: string | null): string {
    
    if (userAvatar) {
        return userAvatar;
    }

    
    return generateAvatar(userId, 'avataaars');
}
