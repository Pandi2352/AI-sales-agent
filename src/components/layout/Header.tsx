import { Link, NavLink } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';

export function Header() {
  const navLinks = [
    { to: ROUTES.HOME, label: 'Home' },
    { to: ROUTES.ABOUT, label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.HOME} className="text-xl font-bold text-primary">
          AI Sales Agent
        </Link>

        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-gray-600',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
