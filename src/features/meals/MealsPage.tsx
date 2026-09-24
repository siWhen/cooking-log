import { useTranslation } from 'react-i18next'
import PlaceholderPage from '../../components/PlaceholderPage'

export default function MealsPage() {
  const { t } = useTranslation()
  return <PlaceholderPage title={t('pages.meals.title')} description={t('pages.meals.empty')} />
}
