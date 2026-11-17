import { Outlet } from 'react-router'
import FarmerStatusNotice from '../components/farmer/FarmerStatusNotice'
import useFarmerData from '../hooks/useFarmerData'

/**
 * Blocks pages that need a farmer who is NOT suspended (adding / editing
 * products). Firestore rules enforce the same thing on the server.
 */
export default function ActiveFarmerRoute() {
  const farmerData = useFarmerData()

  if (!farmerData.canSell) {
    return (
      <div className="max-w-2xl">
        <FarmerStatusNotice status={farmerData.farmerStatus} />
      </div>
    )
  }

  // Pass the farmer data on to the pages inside.
  return <Outlet context={farmerData} />
}
