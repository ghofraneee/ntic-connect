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
        Les outils de votre espace seront ajoutés au fil des prochaines étapes.
      </p>
      <p className="app-page__note">
        Cette session de démonstration est enregistrée sur cet appareil. Les
        données partagées entre les rôles seront ajoutées à l’étape 3.
      </p>
    </section>
  )
}
