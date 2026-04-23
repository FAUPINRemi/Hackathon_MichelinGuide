import RestaurantsTab from './RestaurantsTab'
import HotelsTab from './HotelsTab'

export default function HomePage({ activeTab, onRestaurantClick, onHotelClick, onSave, isAnySaved, onLegalPage }) {
  if (activeTab === 'hotels') {
    return <HotelsTab onHotelClick={onHotelClick} onSave={onSave} isAnySaved={isAnySaved} onLegalPage={onLegalPage} />
  }
  return <RestaurantsTab onRestaurantClick={onRestaurantClick} onSave={onSave} isAnySaved={isAnySaved} onLegalPage={onLegalPage} />
}
