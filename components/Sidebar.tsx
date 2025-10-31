import React, { useContext } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AppContext } from '../App';
import { StageFlowLogoIcon } from './icons/StageFlowLogoIcon';
import { mainNavItems, footerNavItems } from '../lib/navigation';

interface SidebarProps {
    isMobileNavOpen: boolean;
    closeMobileNav: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileNavOpen, closeMobileNav }) => {
    const { currentUser } = useContext(AppContext);

    if (!currentUser) {
        return null;
    }
    
    const visibleMainItems = mainNavItems.filter(item => item.roles.includes(currentUser.role));
    const visibleFooterItems = footerNavItems.filter(item => item.roles.includes(currentUser.role));

    const handleNavLinkClick = () => {
        if (isMobileNavOpen) {
            closeMobileNav();
        }
    }

  return (
    <>
      <div 
        className={`flex flex-col w-64 bg-card border-r border-border print:hidden fixed h-full z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Link to="/dashboard" onClick={handleNavLinkClick} className="flex items-center justify-center h-20 border-b border-border transition-colors hover:bg-accent">
          <StageFlowLogoIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold ml-2">StageFlow</h1>
        </Link>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {visibleMainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavLinkClick}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-lg font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        {visibleFooterItems.length > 0 && (
          <div className="px-4 py-6 border-t border-border">
              {visibleFooterItems.map((item) => (
                   <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={handleNavLinkClick}
                      className={({ isActive }) =>
                          `flex items-center px-4 py-2 text-lg font-medium rounded-lg transition-colors duration-200 ${
                              isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`
                          }
                      >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                  </NavLink>
              ))}
          </div>
        )}
      </div>
      {/* Overlay for mobile */}
      {isMobileNavOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={closeMobileNav}></div>}
    </>
  );
};