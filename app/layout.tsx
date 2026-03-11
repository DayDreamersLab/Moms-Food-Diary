import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Mom's Food Diary — A Collection of Special Food to Remember",
  description: 'A diary for the meals that made you who you are.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              fontFamily: "'Lora', serif",
              background: '#fffaf4',
              color: '#3d2b1f',
              border: '1.5px solid #f5e9d3',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(122,79,46,0.15)',
            },
          }}
        />
      </body>
    </html>
  );
}
