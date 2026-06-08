export function BlogPostCard({ url, title, description, readingTime, image }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="pl-blog-card">
      {image && (
        <div className="pl-blog-card-image">
          <img src={image} alt={title} width={1200} height={630} loading="lazy" decoding="async" />
        </div>
      )}
      <div className="pl-blog-card-body">
        {readingTime && (
          <div className="pl-blog-card-meta">{readingTime} min read · Polaris blog</div>
        )}
        <div className="pl-blog-card-title">{title}</div>
        {description && <div className="pl-blog-card-desc">{description}</div>}
      </div>
    </a>
  )
}
