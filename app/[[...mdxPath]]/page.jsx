import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'
import { JsonLd } from '../JsonLd'
import { kindForPath, sectionForPath } from '../search-taxonomy.mjs'
import { searchTermsForPath } from '../search-vocabulary.mjs'
import { buildPageJsonLd, buildPageMetadata } from '../seo.mjs'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0
}

// Pagefind-only signals for every page. `section`/`kind` travel with each result
// so the search panel can show where a hit lives and color-code its type without
// re-deriving anything client-side; `section` is also the filter facet. Curated
// synonyms are indexed but heavily down-weighted so they help recall without
// outranking real prose or dominating excerpts. None of this is visible or read
// by assistive tech.
function SearchMeta({ path }) {
  const section = sectionForPath(path)
  const kind = kindForPath(path)
  const { terms, priorityTerms } = searchTermsForPath(path)

  return (
    <>
      <span
        style={srOnly}
        data-pagefind-meta={`section:${section}`}
        data-pagefind-filter={`section:${section}`}
      />
      <span style={srOnly} data-pagefind-meta={`kind:${kind}`} />
      {priorityTerms.length ? (
        <span aria-hidden="true" style={srOnly} data-pagefind-weight="2">
          {priorityTerms.join(' ')}
        </span>
      ) : null}
      {terms.length ? (
        <span aria-hidden="true" style={srOnly} data-pagefind-weight="0.1">
          {terms.join(' ')}
        </span>
      ) : null}
    </>
  )
}

export async function generateMetadata(props) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  const path = params.mdxPath?.length ? `/${params.mdxPath.join('/')}` : '/'
  return buildPageMetadata(metadata, path)
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props) {
  const params = await props.params
  const { default: MDXContent, toc, metadata, sourceCode } = await importPage(params.mdxPath)
  const path = params.mdxPath?.length ? `/${params.mdxPath.join('/')}` : '/'
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <SearchMeta path={path} />
      <JsonLd
        data={buildPageJsonLd({
          metadata,
          path,
          sourceCode
        })}
      />
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}
