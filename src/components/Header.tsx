

import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronsUpDown, Bell, LogOut, Check, Menu } from 'lucide-react';
import { Button } from './ui/Button';
import { AppContext } from '../App';
import { Popover } from './ui/Popover';
import { Avatar } from './ui/Avatar';

interface HeaderProps {
    onMobileNavToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileNavToggle }) => {
    const { currentUser, currentBand, bands, switchBand, logout } = useContext(AppContext);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const handleSwitchBand = (bandId: string) => {
      switchBand(bandId);
      setIsPopoverOpen(false);
    }

    const popoverContent = (
      <div className="p-2 w-64">
        <p className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Kies een band</p>
        <div className="space-y-1">
          {bands.map(band => (
            <Button
              key={band.id}
              variant="ghost"
              className="w-full justify-between"
              onClick={() => handleSwitchBand(band.id)}
            >
              {band.name}
              {band.id === currentBand?.id && <Check className="h-4 w-4" />}
            </Button>
          ))}
        </div>
      </div>
    );

  return (
    <header className="flex items-center justify-between h-20 px-4 md:px-8 bg-card border-b border-border print:hidden md:relative sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileNavToggle} aria-label="Open navigation menu">
            <Menu className="h-6 w-6" />
        </Button>
        <Popover
          isOpen={isPopoverOpen}
          setIsOpen={setIsPopoverOpen}
          content={popoverContent}
          trigger={
            <Button variant="ghost" className="flex items-center text-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-full mr-3 flex items-center justify-center text-primary-foreground font-bold">
                  {currentBand?.logoUrl ? <img src={currentBand.logoUrl} alt={currentBand.name} className="h-8 w-8 rounded-full object-cover" /> : currentBand?.name.charAt(0) || 'B'}
                </div>
                <span className="hidden sm:inline">{currentBand?.name || 'Selecteer een band'}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 ml-2 text-muted-foreground" />
            </Button>
          }
        />
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        {currentUser && (
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link to="/settings" className="flex items-center rounded-lg p-1 -m-1 hover:bg-accent transition-colors">
                <Avatar src={currentUser.avatar} firstName={currentUser.firstName} lastName={currentUser.lastName} className="h-10 w-10" />
                <div className="ml-3 text-left hidden md:block">
                    <p className="font-semibold">{currentUser.firstName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{currentUser.role}</p>
                </div>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Uitloggen">
                <LogOut className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
              </Button>
            </div>
        )}
      </div>
    </header>
  );
};
