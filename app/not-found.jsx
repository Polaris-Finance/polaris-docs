import { pathWithBase } from './site-config.mjs'

export default function NotFound() {
  return (
    <main style={{ margin: '0 auto', maxWidth: '46rem', padding: '6rem 1.5rem' }}>
      <article>
        <h1>404 - Page not found</h1>
        <p>This page drifted out of orbit. Use the sidebar or search to find your way back.</p>
        <p>
          <a href={pathWithBase('/')}>Return to the docs home page</a>
        </p>
      </article>
    </main>
  )
}
