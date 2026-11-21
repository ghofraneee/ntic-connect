import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  type DemoAccount,
} from '../../auth/demoAccounts'
import {
  ROLE_HOME_PATHS,
  ROLE_LABELS,
  USER_ROLES,
  type UserRole,
} from '../../auth/roles'
import { useToast } from '../../components/app/useToast'
import './LoginPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type LoginFields = {
  email: string
  password: string
}

type FieldErrors = Partial<Record<keyof LoginFields, string>>

function DiamondMotif() {
  return (
    <svg
      className="login-aside__motif"
      viewBox="0 0 240 120"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M62 7 117 62 62 117 7 62 62 7Z"
        stroke="var(--color-green)"
        strokeWidth="10"
      />
      <path
        d="M120 7 175 62 120 117 65 62 120 7Z"
        stroke="var(--color-gray)"
        strokeWidth="10"
      />
      <path
        d="m178 7 55 55-55 55-55-55 55-55Z"
        stroke="var(--color-blue)"
        strokeWidth="10"
      />
    </svg>
  )
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [fields, setFields] = useState<LoginFields>({
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')

  if (user !== null) {
    return <Navigate to={ROLE_HOME_PATHS[user.role]} replace />
  }

  const enterAs = (account: DemoAccount) => {
    login(account.user)
    navigate(ROLE_HOME_PATHS[account.user.role], { replace: true })
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = fields.email.trim().toLowerCase()
    const errors: FieldErrors = {}

    if (!email) {
      errors.email = 'Saisissez votre adresse e-mail.'
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = 'Saisissez une adresse e-mail valide.'
    }

    if (!fields.password) {
      errors.password = 'Saisissez votre mot de passe.'
    }

    setFieldErrors(errors)
    setFormError('')
    if (Object.keys(errors).length > 0) return

    const account = Object.values(DEMO_ACCOUNTS).find(
      (candidate) =>
        candidate.email === email && candidate.password === fields.password,
    )

    if (!account) {
      setFormError('Adresse e-mail ou mot de passe incorrect.')
      return
    }

    enterAs(account)
  }

  const setField = (field: keyof LoginFields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
  }

  const enterByRole = (role: UserRole) => enterAs(DEMO_ACCOUNTS[role])

  return (
    <div className="login-page">
      <aside className="login-aside">
        <Link className="login-aside__brand" to="/" aria-label="Retour à l’accueil">
          NTIC <strong>Connect</strong>
        </Link>
        <DiamondMotif />
        <div className="login-aside__copy">
          <p className="login-aside__eyebrow">OFPPT · NTIC Safi</p>
          <h1>
            La vie du campus,
            <br />
            au même endroit.
          </h1>
          <p>
            Retrouvez les informations et les services utiles à votre rôle dans
            l’établissement.
          </p>
        </div>
        <Link className="login-aside__back" to="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Retour au site public
        </Link>
      </aside>

      <main className="login-main">
        <section className="login-panel" aria-labelledby="login-title">
          <p className="login-panel__eyebrow">Espace membre</p>
          <h2 id="login-title">Se connecter</h2>
          <p className="login-panel__intro">
            Utilisez votre compte de démonstration pour continuer.
          </p>

          <form className="login-form" noValidate onSubmit={submit}>
            <div className="login-field">
              <label htmlFor="login-email">Adresse e-mail</label>
              <input
                autoComplete="username"
                id="login-email"
                name="email"
                type="email"
                value={fields.email}
                placeholder="nom@demo.ma"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email ? 'login-email-error' : undefined
                }
                onChange={(event) => setField('email', event.target.value)}
              />
              {fieldErrors.email && (
                <p className="login-field__error" id="login-email-error">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Mot de passe</label>
              <input
                autoComplete="current-password"
                id="login-password"
                name="password"
                type="password"
                value={fields.password}
                placeholder="Votre mot de passe"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? 'login-password-error' : undefined
                }
                onChange={(event) => setField('password', event.target.value)}
              />
              {fieldErrors.password && (
                <p className="login-field__error" id="login-password-error">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="login-form__options">
              <button
                className="login-forgot"
                type="button"
                onClick={() =>
                  showToast(
                    'La réinitialisation du mot de passe n’est pas disponible dans cette démo.',
                  )
                }
              >
                Mot de passe oublié ?
              </button>
            </div>

            {formError && (
              <p className="login-form__error" role="alert">
                {formError}
              </p>
            )}

            <button className="login-submit" type="submit">
              Se connecter
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          </form>

          <section className="login-demos" aria-labelledby="demo-title">
            <div className="login-demos__heading">
              <div>
                <p className="login-panel__eyebrow">Accès rapide</p>
                <h3 id="demo-title">Comptes de démonstration</h3>
              </div>
            </div>
            <div className="login-demos__grid">
              {USER_ROLES.map((role) => (
                <button
                  className="login-demo"
                  key={role}
                  type="button"
                  onClick={() => enterByRole(role)}
                >
                  <span>
                    <strong>{ROLE_LABELS[role]}</strong>
                    <small>{DEMO_ACCOUNTS[role].email}</small>
                  </span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="login-demos__password">
              Mot de passe commun : <code>{DEMO_PASSWORD}</code>
            </p>
          </section>
        </section>
      </main>
    </div>
  )
}
