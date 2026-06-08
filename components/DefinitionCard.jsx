export function DefinitionCard({ term, token, children }) {
  return (
    <section className={`pl-definition-card pl-def-${token ?? 'default'}`}>
      <div className="pl-definition-term">
        {term}
        {token ? <code>{token}</code> : null}
      </div>
      <div className="pl-definition-desc">{children}</div>
    </section>
  )
}
