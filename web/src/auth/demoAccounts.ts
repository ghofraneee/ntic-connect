import type { AuthUser, UserRole } from './roles'

export type DemoAccount = {
  email: string
  password: string
  user: AuthUser
}

export const DEMO_PASSWORD = 'demo1234'

export const DEMO_ACCOUNTS: Record<UserRole, DemoAccount> = {
  stagiaire: {
    email: 'stagiaire@demo.ma',
    password: DEMO_PASSWORD,
    user: {
      id: 'demo-stagiaire',
      name: 'Lina Démo',
      email: 'stagiaire@demo.ma',
      role: 'stagiaire',
      filiere: 'Développement Digital',
    },
  },
  formateur: {
    email: 'formateur@demo.ma',
    password: DEMO_PASSWORD,
    user: {
      id: 'demo-formateur',
      name: 'Sami Démo',
      email: 'formateur@demo.ma',
      role: 'formateur',
    },
  },
  direction: {
    email: 'direction@demo.ma',
    password: DEMO_PASSWORD,
    user: {
      id: 'demo-direction',
      name: 'Nadia Démo',
      email: 'direction@demo.ma',
      role: 'direction',
    },
  },
  club: {
    email: 'club@demo.ma',
    password: DEMO_PASSWORD,
    user: {
      id: 'demo-club',
      name: 'Rayan Démo',
      email: 'club@demo.ma',
      role: 'club',
    },
  },
}
