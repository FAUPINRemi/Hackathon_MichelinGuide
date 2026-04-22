import { useState } from 'react'
import Nav from './components/navigation/Nav'
import BottomNav from './components/navigation/BottomNav'
import Toast from './components/feedback/Toast'
import InstallBanner from './components/feedback/InstallBanner'
import AddToListDialog from './components/feedback/AddToListDialog'
import HomePage from './pages/HomePage'
import FavoritesPage from './pages/FavoritesPage'
import RestaurantDetailPage from './pages/RestaurantDetailPage'
import HotelDetailPage from './pages/HotelDetailPage'
import { useToast } from './hooks/useToast'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { useFavorites } from './hooks/useFavorites'
import styles from './App.module.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('restaurants')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [dialogItem, setDialogItem] = useState(null)
  const { message, visible, showToast } = useToast()
  const { showBanner, install, dismiss } = useInstallPrompt()
  const favorites = useFavorites()

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
    if (tab === 'profile') showToast('Section bientôt disponible')
  }

  const handleSave = (item, type) => {
    setDialogItem({ item, type })
  }

  const handleInstall = async () => {
    const outcome = await install()
    if (outcome === 'accepted') showToast('Application installée !')
  }

  const detailName = selectedRestaurant?.name ?? selectedHotel?.name
  const navTitle = isDetail ? detailName : (
    activeTab === 'restaurants' ? 'Restaurants'
    : activeTab === 'hotels'   ? 'Hébergements'
    : activeTab === 'profile'  ? 'Mon Profil'
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
        ) : activeTab === 'favorites' ? (
          <FavoritesPage
            lists={favorites.lists}
            items={favorites.items}
            createList={favorites.createList}
            renameList={favorites.renameList}
            deleteList={favorites.deleteList}
            removeFromList={favorites.removeFromList}
            getNote={favorites.getNote}
            setNote={favorites.setNote}
            onItemClick={(item, type) => {
              if (type === 'restaurant') handleRestaurantClick(item)
              else handleHotelClick(item)
            }}
          />
        ) : (
          <HomePage
            activeTab={activeTab}
            onRestaurantClick={handleRestaurantClick}
            onHotelClick={handleHotelClick}
            onSave={handleSave}
            isAnySaved={favorites.isAnySaved}
          />
        )}
      </main>

      <BottomNav active={activeTab} onChange={handleTabChange} />
      <InstallBanner visible={showBanner} onInstall={handleInstall} onDismiss={dismiss} />
      <Toast message={message} visible={visible} />
      {dialogItem && (
        <AddToListDialog
          item={dialogItem.item}
          type={dialogItem.type}
          lists={favorites.lists}
          items={favorites.items}
          onAddToList={favorites.addToList}
          onRemoveFromList={favorites.removeFromList}
          onCreateList={favorites.createList}
          onClose={() => setDialogItem(null)}
        />
      )}
    </div>
  )
}
