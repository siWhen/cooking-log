import { useTranslation } from 'react-i18next'
import PlaceholderPage from '../../components/PlaceholderPage'

export default function IngredientsPage() {
  const { t } = useTranslation()
  return <PlaceholderPage title={t('pages.ingredients.title')} description={t('pages.ingredients.empty')} />
}
