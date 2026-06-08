function safeJson(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function JsonLd({ data }) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean)

  return items.map((item, index) => (
    <script
      key={index}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(item) }}
    />
  ))
}
