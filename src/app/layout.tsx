import './globals.css';

export const metadata = {
  title: 'Woonpoints',
  description: 'WoningNet points and reaction dashboard'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>
        <nav aria-label="Verhuisgereedschap" style={{ background: '#edf6f4', padding: '10px 18px', textAlign: 'right', fontFamily: 'system-ui, sans-serif', fontSize: 14 }}>
          <a href="/dozenlabels" style={{ color: '#075e57', fontWeight: 750, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Print verhuisdozenlabels ↗
          </a>
        </nav>
        {children}
      </body>
    </html>
  );
}
