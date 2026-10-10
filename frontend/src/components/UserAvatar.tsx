import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  // Validate and sanitize image URL
  const validSrc =
    src &&
    typeof src === 'string' &&
    src.trim() !== '' &&
    src.trim() !== 'null' &&
    src.trim() !== 'undefined'
      ? src.trim()
      : null;

  // Compute initials fallback (e.g., 'Anish M' -> 'A', 'Rahul' -> 'R')
  const initial =
    name && name.trim()
      ? name.trim().charAt(0).toUpperCase()
      : 'U';

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs rounded-full',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-16 h-16 text-2xl rounded-2xl',
    xl: 'w-20 h-20 text-3xl rounded-3xl',
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  if (validSrc && !imageFailed) {
    return (
      <img
        src={validSrc}
        alt={name || 'User Profile'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImageFailed(true)}
        className={`object-cover border-2 border-indigo-100 dark:border-indigo-900/50 shadow-xs flex-shrink-0 ${currentSize} ${className}`}
      />
    );
  }

  return (
    <div
      className={`bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white font-extrabold flex items-center justify-center shadow-xs border border-indigo-200/40 dark:border-indigo-500/30 select-none flex-shrink-0 ${currentSize} ${className}`}
      title={name || 'User Avatar'}
    >
      {initial}
    </div>
  );
};

