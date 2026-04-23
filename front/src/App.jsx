import { useState } from 'react'
import Nav from './components/navigation/Nav'
import BottomNav from './components/navigation/BottomNav'
import Toast from './components/feedback/Toast'
import InstallBanner from './components/feedback/InstallBanner'
import HomePage from './pages/HomePage'
import RestaurantDetailPage from './pages/RestaurantDetailPage'
import HotelDetailPage from './pages/HotelDetailPage'
import ProfilePage from './pages/ProfilePage'
import CollectionPage from './pages/CollectionPage'
import { useToast } from './hooks/useToast'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import styles from './App.module.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('restaurants')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const { message, visible, showToast } = useToast()
  const { showBanner, install, dismiss } = useInstallPrompt()

  const isDetail = !!(selectedRestaurant || selectedHotel)

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant)
    setSelectedHotel(null)
    window.scrollTo(0, 0)
  }

  const handleHotelClick = (hotel) => {
    setSelectedHotel(hotel)
    setSelectedRestaurant(null)
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    setSelectedRestaurant(null)
    setSelectedHotel(null)
    window.scrollTo(0, 0)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSelectedRestaurant(null)
    setSelectedHotel(null)
    setCollectionOpen(false)
    if (tab === 'favorites') showToast('Section bientôt disponible')
  }

  const handleInstall = async () => {
    const outcome = await install()
    if (outcome === 'accepted') showToast('Application installée !')
  }

  const detailName = selectedRestaurant?.name ?? selectedHotel?.name
  const navTitle = isDetail ? detailName : (
    activeTab === 'restaurants' ? 'Restaurants'
    : activeTab === 'hotels'   ? 'Hébergements'
    : activeTab === 'profile'  ? 'Compte'
    : 'Favoris'
  )

  return (
    <div className={styles.app}>
      <Nav
        title={navTitle}
        showBack={isDetail}
        onBack={handleBack}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <main className={styles.main}>
        {selectedRestaurant ? (
          <RestaurantDetailPage restaurant={selectedRestaurant} />
        ) : selectedHotel ? (
          <HotelDetailPage hotel={selectedHotel} />
        ) : activeTab === 'profile' && collectionOpen ? (
          <CollectionPage onClose={() => setCollectionOpen(false)} />
        ) : activeTab === 'profile' ? (
          <ProfilePage onOpenCollection={() => setCollectionOpen(true)} />
        ) : (
          <HomePage
            activeTab={activeTab}
            onRestaurantClick={handleRestaurantClick}
            onHotelClick={handleHotelClick}
          />
        )}
      </main>

      <BottomNav active={activeTab} onChange={handleTabChange} />
      <InstallBanner visible={showBanner} onInstall={handleInstall} onDismiss={dismiss} />
      <Toast message={message} visible={visible} />
    </div>
  )
}
