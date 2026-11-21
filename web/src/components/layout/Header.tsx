import { useEffect, useRef, useState } from 'react'
import './Header.css'

const links = [
  { label: 'Fonctionnalités', href: '/fonctionnalites' },
  { label: 'Espaces', href: '#espaces' },
  { label: 'Actualités', href: '/actualites' },
  { label: 'Clubs', href: '/clubs' },
  { label: 'Contact', href: '/contact' },
]

export default function Header() {
  const [compact, setCompact] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const updateCompact = () => setCompact(window.scrollY > 24)

    updateCompact()
    window.addEventListener('scroll', updateCompact, { passive: true })
    return () => window.removeEventListener('scroll', updateCompact)
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    const menuButton = menuButtonRef.current
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        return
      }

      if (event.key !== 'Tab' || !menuRef.current) return
      const focusable = menuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      menuButton?.focus()
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header
      className={`site-header${compact ? ' site-header--compact' : ''}`}
    >
      <div className="site-header__inner">
        <a
          className="site-brand"
          href="/"
          aria-label="NTIC Connect, accueil"
        >
          <img
            className="site-brand__logo"
            src="/ofppt-logo.png"
            alt=""
            width="48"
            height="48"
          />
          <span className="site-brand__name">
            NTIC <strong>Connect</strong>
          </span>
        </a>

        <nav className="site-nav" aria-label="Navigation principale">
          {links.map(({ label, href }) => (
            <a className="site-nav__link" href={href} key={label}>
              {label}
            </a>
          ))}
        </nav>

        <a className="site-header__login" href="/login">
          Se connecter
        </a>

        <button
          ref={menuButtonRef}
          className="site-header__menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="navigation-mobile"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <nav
          ref={menuRef}
          id="navigation-mobile"
          className="mobile-menu"
          aria-label="Navigation mobile"
          aria-modal="true"
          role="dialog"
        >
          <div className="mobile-menu__top">
            <a className="site-brand" href="/" onClick={closeMenu}>
              <img
                className="site-brand__logo"
                src="/ofppt-logo.png"
                alt=""
                width="48"
                height="48"
              />
              <span className="site-brand__name">
                NTIC <strong>Connect</strong>
              </span>
            </a>
            <button
              ref={closeButtonRef}
              className="mobile-menu__close"
              type="button"
              onClick={closeMenu}
            >
              Fermer
            </button>
          </div>
          <div className="mobile-menu__links">
            {links.map(({ label, href }, index) => (
              <a href={href} key={label} onClick={closeMenu}>
                <span>0{index + 1}</span>
                {label}
              </a>
            ))}
          </div>
          <a className="mobile-menu__login" href="/login" onClick={closeMenu}>
            Se connecter
          </a>
          <p className="mobile-menu__caption">OFPPT · NTIC Safi</p>
        </nav>
      )}
    </header>
  )
}
