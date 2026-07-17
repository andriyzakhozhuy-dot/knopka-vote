'use client';

import { showToast } from '@/lib/toast';

const SHARE_TEXT = 'Проголосуй за продовження акції «Рюкзак + в рюкзак» у Кнопці!';

function shareTo(type: 'telegram' | 'viber' | 'copy') {
  const VOTE_URL = window.location.origin;
  if (type === 'telegram') {
    window.open(
      'https://t.me/share/url?url=' + encodeURIComponent(VOTE_URL) + '&text=' + encodeURIComponent(SHARE_TEXT),
      '_blank',
    );
  } else if (type === 'viber') {
    window.open('viber://forward?text=' + encodeURIComponent(SHARE_TEXT + ' ' + VOTE_URL), '_blank');
  } else {
    navigator.clipboard.writeText(VOTE_URL).then(() => showToast('Посилання скопійовано'));
  }
}

export default function ShareButtons() {
  return (
    <section className="share reveal">
      <p>Поділіться з друзями — разом переможемо</p>
      <div className="share-row">
        <button className="share-btn" onClick={() => shareTo('telegram')}>Telegram</button>
        <button className="share-btn" onClick={() => shareTo('viber')}>Viber</button>
        <button className="share-btn" onClick={() => shareTo('copy')}>Скопіювати посилання</button>
      </div>
    </section>
  );
}
