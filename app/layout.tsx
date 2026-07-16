import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Кнопка — Голосуй за продовження акції «Рюкзак + в рюкзак»',
  description:
    'Проголосуйте, і якщо набереться 1000 голосів, ми продовжимо акцію «Рюкзак + в рюкзак» — купуєш рюкзак і отримуєш -50% на все, що покладеш в нього.',
  openGraph: {
    title: 'Кнопка — Хочеш, щоб акція тривала довше?',
    description:
      'Проголосуйте за продовження акції «Рюкзак + в рюкзак» — купуєш рюкзак і отримуєш -50% на все, що покладеш в нього.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
