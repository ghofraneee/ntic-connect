import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type SceneErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
}

type SceneErrorBoundaryState = {
  hasError: boolean
}

export default class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('The 3D background failed to load.', error, errorInfo)
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
