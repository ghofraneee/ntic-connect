import './Footer.css'

const links = [
  { label: 'Fonctionnalités', href: '/fonctionnalites' },
  { label: 'Espaces', href: '#espaces' },
  { label: 'Actualités', href: '/actualites' },
  { label: 'Clubs', href: '/clubs' },
  { label: 'Contact', href: '/contact' },
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="site-footer__identity">
          <p className="site-footer__eyebrow">OFPPT · NTIC Safi</p>
          <a className="site-footer__wordmark" href="/" aria-label="NTIC Connect, accueil">
            NTIC
            <br />
            Connect
          </a>
        </div>

        <nav className="site-footer__nav" aria-label="Navigation de pied de page">
          <p className="site-footer__eyebrow">Explorer</p>
          {links.map(({ label, href }) => (
            <a href={href} key={label}>
              {label}
            </a>
          ))}
        </nav>

        <div className="site-footer__contact">
          <p className="site-footer__eyebrow">Le projet</p>
          <p>Un prototype pour la communauté OFPPT NTIC Safi.</p>
          <a href="/contact">Nous écrire</a>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>OFPPT NTIC Safi</span>
        <span>Version prototype – données fictives</span>
        <a href="#hero">Retour en haut ↑</a>
      </div>
    </footer>
  )
}
