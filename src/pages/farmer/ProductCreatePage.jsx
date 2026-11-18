import { useNavigate } from 'react-router'
import PageHeader from '../../components/farmer/PageHeader'
import ProductForm from '../../components/farmer/ProductForm'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useFarmerData from '../../hooks/useFarmerData'
import { PATHS } from '../../routes/paths'
import { createProduct } from '../../services/productService'
import { t } from '../../i18n'

export default function ProductCreatePage() {
  const navigate = useNavigate()
  const { uid, farm, farmLoading } = useFarmerData()

  if (farmLoading) return <Spinner fullPage />

  // Products show the farm's name and location, so the profile comes first.
  if (!farm) {
    return (
      <EmptyState
        title={t('Set up your farm profile first')}
        message={t('Customers see your farm name and location on every product. Add them before listing products.')}
        action={<Button to={PATHS.FARMER_PROFILE}>{t('Set up farm profile')}</Button>}
      />
    )
  }

  async function handleSubmit(values) {
    await createProduct(uid, farm, values)
    navigate(PATHS.FARMER_PRODUCTS, {
      state: { notice: t('“{product}” was added.', { product: values.name.trim() }) },
    })
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={t('Add product')} subtitle={t('Listing for {farm}', { farm: farm.farmName })} />
      <ProductForm
        submitLabel={t('Add product')}
        onSubmit={handleSubmit}
        onCancel={() => navigate(PATHS.FARMER_PRODUCTS)}
      />
    </div>
  )
}
