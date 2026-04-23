import RestaurantsTab from './RestaurantsTab'
import HotelsTab from './HotelsTab'

export default function HomePage({ activeTab, onRestaurantClick, onHotelClick, onSave, isAnySaved }) {
  if (activeTab === 'hotels') {
    return <HotelsTab onHotelClick={onHotelClick} onSave={onSave} isAnySaved={isAnySaved} />
  }
  return <RestaurantsTab onRestaurantClick={onRestaurantClick} onSave={onSave} isAnySaved={isAnySaved} />
}
