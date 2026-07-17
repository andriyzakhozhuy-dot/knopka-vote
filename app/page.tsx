import Image from 'next/image';
import VoteSection from '@/components/VoteSection';
import ShareButtons from '@/components/ShareButtons';
import ConfettiCanvas from '@/components/ConfettiCanvas';
import RevealOnScroll from '@/components/RevealOnScroll';

export default function Home() {
  return (
    <>
      <RevealOnScroll />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <ConfettiCanvas />
      <div className="toast" id="toast" />

      <div className="wrap">
        <header className="reveal">
          <Image
            className="logo-img"
            src="/logo.png"
            alt="Кнопка — Art Gifts Trend Shop"
            width={1280}
            height={640}
            priority
          />
        </header>

        <section className="hero reveal">
          <h1>Петиція на продовження акції</h1>
          <p>Рюкзак + знижка -50% на канцтовари до школи</p>
        </section>

        <ShareButtons />

        <VoteSection />

        <section className="conditions">
          <div className="cond-card reveal">
            <div className="cond-icon i1">🎒</div>
            <h3>Умови акції</h3>
            <p>Купуєте будь-який рюкзак у «Кнопці» — отримуєте знижку 50% на шкільне приладдя, яке покладете в нього.</p>
          </div>
          <div className="cond-card reveal">
            <div className="cond-icon i2">📍</div>
            <h3>Де діє</h3>
            <p>Офлайн-магазини «Кнопка» у Рівному та Луцьку. Акція діє під час покупки в торговій точці.</p>
          </div>
          <div className="cond-card reveal">
            <div className="cond-icon i3">🔗</div>
            <h3>Дізнатись більше</h3>
            <p>Весь асортимент і адреси магазинів</p>
            <a className="cond-btn" href="https://knopka.shop/" target="_blank" rel="noopener">
              Перейти на knopka.shop
            </a>
          </div>
        </section>

        <footer className="reveal">
          <div className="footer-grid">
            <div className="store-card">
              <h4>Магазин у Рівному</h4>
              <div className="store-line">
                <span className="ic">📍</span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=%D0%A0%D1%96%D0%B2%D0%BD%D0%B5%2C%20%D0%B2%D1%83%D0%BB.%20%D0%9A%D0%BD%D1%8F%D0%B3%D0%B8%D0%BD%D0%B8%D1%86%D1%8C%D0%BA%D0%BE%D0%B3%D0%BE%2C%201"
                  target="_blank"
                  rel="noopener"
                >
                  33013, Україна, Рівненська обл., м. Рівне, вул. Княгиницького, 1
                </a>
              </div>
              <div className="store-line">
                <span className="ic">📍</span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=%D0%B2%D1%83%D0%BB%D0%B8%D1%86%D1%8F%20%D0%9A%D0%B8%D1%97%D0%B2%D1%81%D1%8C%D0%BA%D0%B0%2C%2067a%2C%20%D0%A0%D1%96%D0%B2%D0%BD%D0%B5%2C%20%D0%A0%D1%96%D0%B2%D0%BD%D0%B5%D0%BD%D1%81%D1%8C%D0%BA%D0%B0%20%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C%2C%2033027"
                  target="_blank"
                  rel="noopener"
                >
                  вулиця Київська, 67а, Рівне, Рівненська область, 33027
                </a>
              </div>
              <div className="store-line">
                <span className="ic">📍</span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=%D0%B2%D1%83%D0%BB%D0%B8%D1%86%D1%8F%20%D0%93%D0%B5%D1%80%D0%BE%D1%97%D0%B2%20%D0%BF%D0%BE%D0%BB%D1%96%D1%86%D1%96%D1%97%2C%2040%2C%20%D0%A0%D1%96%D0%B2%D0%BD%D0%B5%2C%20%D0%A0%D1%96%D0%B2%D0%BD%D0%B5%D0%BD%D1%81%D1%8C%D0%BA%D0%B0%20%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C%2C%2033017"
                  target="_blank"
                  rel="noopener"
                >
                  вулиця Героїв поліції, 40, Рівне, Рівненська область, 33017
                </a>
              </div>
              <div className="store-line">
                <span className="ic">📍</span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=%D0%B2%D1%83%D0%BB%D0%B8%D1%86%D1%8F%20%D0%A1%D0%B5%D1%80%D0%B3%D1%96%D1%8F%20%D0%91%D0%B0%D1%87%D0%B8%D0%BD%D1%81%D1%8C%D0%BA%D0%BE%D0%B3%D0%BE%2C%205%2C%20%D0%A0%D1%96%D0%B2%D0%BD%D0%B5%2C%20%D0%A0%D1%96%D0%B2%D0%BD%D0%B5%D0%BD%D1%81%D1%8C%D0%BA%D0%B0%20%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C%2C%2033017"
                  target="_blank"
                  rel="noopener"
                >
                  вулиця Сергія Бачинського, 5, Рівне, Рівненська область, 33017
                </a>
              </div>
              <div className="store-line">
                <span className="ic">🕘</span>
                <div className="store-hours">
                  <span>Пн–Пт: 08:30–19:00</span>
                  <span>Сб–Нд: 09:00–18:00</span>
                </div>
              </div>
              <div className="store-line">
                <span className="ic">📞</span>
                <a className="phone-link" href="tel:+380675490031">(067) 549-00-31</a>
              </div>
            </div>

            <div className="store-card">
              <h4>Магазин у Луцьку</h4>
              <div className="store-line">
                <span className="ic">📍</span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=%D0%9B%D1%83%D1%86%D1%8C%D0%BA%2C%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%92%D0%BE%D0%BB%D1%96%2C%2027"
                  target="_blank"
                  rel="noopener"
                >
                  проспект Волі, 27, Луцьк, Волинська область, 43000
                </a>
              </div>
              <div className="store-line">
                <span className="ic">🕘</span>
                <div className="store-hours">
                  <span>Пн–Пт: 09:00–19:00</span>
                  <span>Сб–Нд: 10:00–17:00</span>
                </div>
              </div>
              <div className="store-line">
                <span className="ic">📞</span>
                <a className="phone-link" href="tel:+380671749221">(067) 174-92-21</a>
              </div>
            </div>
          </div>

          <div className="social-row">
            <a className="social-icon" href="https://www.facebook.com/knopka.shop.official" target="_blank" rel="noopener" aria-label="Facebook">
              <svg viewBox="0 0 24 24"><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.24 4.32 15.35 4.24 14.3 4.24c-2.17 0-3.66 1.32-3.66 3.76v2.5H8.1v3h2.54V21h2.86z" /></svg>
            </a>
            <a className="social-icon" href="https://www.instagram.com/knopka.shop.official" target="_blank" rel="noopener" aria-label="Instagram">
              <svg viewBox="0 0 24 24"><path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zm0 5.6a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4zm4.3-6.9a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0zM20 8c-.06-1.2-.33-2.27-1.2-3.14C17.93 4 16.86 3.73 15.67 3.67 14.44 3.6 9.56 3.6 8.33 3.67 7.14 3.73 6.07 4 5.2 4.86 4.33 5.73 4.06 6.8 4 8 3.93 9.23 3.93 14.77 4 16c.06 1.2.33 2.27 1.2 3.14.87.87 1.94 1.14 3.13 1.2 1.23.07 6.11.07 7.34 0 1.19-.06 2.26-.33 3.13-1.2.87-.87 1.14-1.94 1.2-3.14.07-1.23.07-6.77 0-8zm-2.15 9.65c-.26.66-.77 1.17-1.43 1.44-.99.39-3.34.3-4.42.3s-3.44.09-4.42-.3a2.5 2.5 0 0 1-1.43-1.44c-.39-.99-.3-3.34-.3-4.42s-.09-3.44.3-4.42c.26-.66.77-1.17 1.43-1.44.99-.39 3.34-.3 4.42-.3s3.44-.09 4.42.3c.66.27 1.17.78 1.43 1.44.39.99.3 3.34.3 4.42s.09 3.44-.3 4.42z" /></svg>
            </a>
            <a className="social-icon" href="https://www.tiktok.com/@knopka.shop" target="_blank" rel="noopener" aria-label="TikTok">
              <svg viewBox="0 0 24 24"><path d="M16.5 3c.4 2.2 1.9 3.8 4.1 4v2.7c-1.5.1-2.9-.4-4.1-1.2v6.6c0 3.4-2.8 5.9-6 5.9-3.3 0-6-2.6-6-5.9s2.8-5.9 6-5.9c.4 0 .8 0 1.2.1v2.8c-.4-.1-.8-.2-1.2-.2-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2 3.3-1.4 3.3-3.2V3h2.7z" /></svg>
            </a>
          </div>

          <div className="footer-bottom">
            Кнопка · офіс · творчість · школа
            <br />
            <a href="https://knopka.shop/" target="_blank" rel="noopener">knopka.shop</a>
          </div>
        </footer>
      </div>
    </>
  );
}
