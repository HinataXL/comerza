import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Reservación | Comerza',
  description: 'Gestiona tu reservación: confírmala, recházala o solicita un nuevo horario.',
};

export default function ReservaTokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
