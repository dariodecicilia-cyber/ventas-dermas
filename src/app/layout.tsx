import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Derma's | Catálogo Profesional",
  description: 'Catálogo exclusivo para profesionales de la estética con opciones de pedido express.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
