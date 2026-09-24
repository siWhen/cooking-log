import { useTranslation } from 'react-i18next'
import PlaceholderPage from '../../components/PlaceholderPage'

export default function SettingsPage() {
  const { t } = useTranslation()
  return <PlaceholderPage title={t('pages.settings.title')} description={t('pages.settings.empty')} />
}
