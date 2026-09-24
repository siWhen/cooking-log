import { createBrowserRouter, Navigate } from 'react-router'
import Layout from './components/Layout'
import IngredientsPage from './features/ingredients/IngredientsPage'
import MealsPage from './features/meals/MealsPage'
import AiPage from './features/ai/AiPage'
import SettingsPage from './features/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/ingredients" replace /> },
      { path: 'ingredients', element: <IngredientsPage /> },
      { path: 'meals', element: <MealsPage /> },
      { path: 'ai', element: <AiPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/ingredients" replace /> },
    ],
  },
])
