import { useState } from 'react'
import Nav from './components/navigation/Nav'
import BottomNav from './components/navigation/BottomNav'
import Toast from './components/feedback/Toast'
import InstallBanner from './components/feedback/InstallBanner'
import HomePage from './pages/HomePage'
import RestaurantDetailPage from './pages/RestaurantDetailPage'
import { useToast } from './hooks/useToast'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import styles from './App.module.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('restaurants')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const { message, visible, showToast } = useToast()
  const { showBanner, install, dismiss } = useInstallPrompt()

  const isDetail = !!selectedRestaurant

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant)
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    setSelectedRestaurant(null)
    window.scrollTo(0, 0)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSelectedRestaurant(null)
    if (tab !== 'restaurants') showToast('Section bientôt disponible')
  }

  const handleInstall = async () => {
    const outcome = await install()
    if (outcome === 'accepted') showToast('Application installée !')
  }

  const navTitle = isDetail ? selectedRestaurant.name : (
    activeTab === 'restaurants' ? 'Restaurants'
    : activeTab === 'hotels' ? 'Hébergements'
    : activeTab === 'profile' ? 'Mon Profil'
    : 'Favoris'
  )

  return (
    <div className={styles.app}>
      <Nav
        title={navTitle}
        showBack={isDetail}
        onBack={handleBack}
      />

      <main className={styles.main}>
        {isDetail ? (
          <RestaurantDetailPage restaurant={selectedRestaurant} />
        ) : (
          <HomePage onRestaurantClick={handleRestaurantClick} />
        )}
      </main>

      <BottomNav active={activeTab} onChange={handleTabChange} />
      <InstallBanner visible={showBanner} onInstall={handleInstall} onDismiss={dismiss} />
      <Toast message={message} visible={visible} />
    </div>
  )
}
