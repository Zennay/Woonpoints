import './globals.css';

export const metadata = {
  title: 'Woonpoints',
  description: 'WoningNet points and reaction dashboard'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
