import { useNavigate, useParams } from 'react-router'
import PageHeader from '../../components/farmer/PageHeader'
import ProductForm from '../../components/farmer/ProductForm'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useFarmerData from '../../hooks/useFarmerData'
import { PATHS } from '../../routes/paths'
import { updateProduct } from '../../services/productService'
import { getFriendlyErrorMessage } from '../../utils/firebaseErrors'
import { productToFormValues } from '../../utils/productValidation'

export default function ProductEditPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const { farm, farmLoading, products, productsLoading, productsError } = useFarmerData()

  if (productsLoading || farmLoading) return <Spinner fullPage />
  if (productsError) {
    return <Alert variant="error">{getFriendlyErrorMessage(productsError)}</Alert>
  }

  // Only this farmer's own products are in the list, so another farmer's
  // product ID simply shows "not found".
  const product = products.find((p) => p.id === productId)
  if (!product || !farm) {
    return (
      <EmptyState
        title="Product not found"
        message="It may have been deleted."
        action={<Button to={PATHS.FARMER_PRODUCTS}>Back to my products</Button>}
      />
    )
  }

  async function handleSubmit(values) {
    await updateProduct(product.id, farm, values)
    navigate(PATHS.FARMER_PRODUCTS, {
      state: { notice: `“${values.name.trim()}” was updated.` },
    })
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Edit product" subtitle={product.name} />
      {/* key: reset the form if a different product is opened */}
      <ProductForm
        key={product.id}
        initialValues={productToFormValues(product)}
        submitLabel="Save changes"
        adminHidden={Boolean(product.hiddenBy)}
        onSubmit={handleSubmit}
        onCancel={() => navigate(PATHS.FARMER_PRODUCTS)}
      />
    </div>
  )
}
