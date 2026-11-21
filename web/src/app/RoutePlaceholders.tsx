import { useAuth } from '../auth/useAuth'
import { ROLE_LABELS } from '../auth/roles'

export function WorkspacePlaceholder() {
  const { user } = useAuth()
  if (user === null) return null

  return (
    <section className="app-page">
      <p className="app-eyebrow">{ROLE_LABELS[user.role]} · Espace privé</p>
      <h1>Votre espace est prêt.</h1>
      <p className="app-page__intro">
        Les outils propres à cet espace seront ajoutés au fil des prochaines
        étapes.
      </p>
      <p className="app-page__note">
        Les données de démonstration sont partagées entre les rôles et
        enregistrées sur cet appareil.
      </p>
    </section>
  )
}
