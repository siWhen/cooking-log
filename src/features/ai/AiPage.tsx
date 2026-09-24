import { useTranslation } from 'react-i18next'
import PlaceholderPage from '../../components/PlaceholderPage'

export default function AiPage() {
  const { t } = useTranslation()
  return <PlaceholderPage title={t('pages.ai.title')} description={t('pages.ai.empty')} />
}
