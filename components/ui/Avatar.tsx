import React from 'react';
import { Building } from 'lucide-react';

interface AvatarProps {
  src?: string;
  firstName: string;
  lastName: string;
  className?: string;
  isCompany?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ src, firstName, lastName, className, isCompany }) => {
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

  if (src) {
    return <img src={src} alt={`${firstName} ${lastName}`} className={`rounded-full object-cover ${className}`} />;
  }
  
  if (isCompany) {
      return (
        <div className={`rounded-full bg-muted flex items-center justify-center ${className}`}>
            <Building className="h-1/2 w-1/2 text-muted-foreground" />
        </div>
      );
  }

  return (
    <div className={`rounded-full bg-muted flex items-center justify-center ${className}`}>
      <span className="font-bold text-muted-foreground">{initials}</span>
    </div>
  );
};