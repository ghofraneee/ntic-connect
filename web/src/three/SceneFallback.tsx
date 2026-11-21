export default function SceneFallback() {
  return (
    <div className="scene-fallback" aria-hidden="true">
      <svg
        className="scene-fallback__logo"
        viewBox="0 0 500 260"
        role="presentation"
      >
        <path
          d="M118 34 202 118 118 202 34 118Z"
          fill="none"
          stroke="#2E9B4F"
          strokeWidth="26"
          strokeLinejoin="miter"
        />
        <path
          d="M250 34 334 118 250 202 166 118Z"
          fill="none"
          stroke="#8A8D91"
          strokeWidth="26"
          strokeLinejoin="miter"
        />
        <path
          d="M382 34 466 118 382 202 298 118Z"
          fill="none"
          stroke="#1F4E9C"
          strokeWidth="26"
          strokeLinejoin="miter"
        />
      </svg>
    </div>
  )
}
