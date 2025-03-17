import { useRouter } from 'next/router'
import Link from 'next/link'

export default function LanguageSwitcher() {
  const router = useRouter()
  const { pathname, asPath, query, locale } = router

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'bg', name: 'Български' },
    { code: 'de', name: 'Deutsch' },
  ]

  return (
    <div className="language-switcher">
      {languages.map((lang) => (
        <Link
          href={{ pathname, query }}
          as={asPath}
          locale={lang.code}
          key={lang.code}
        >
          <a className={locale === lang.code ? 'active' : ''}>
            {lang.name}
          </a>
        </Link>
      ))}
    </div>
  )
}