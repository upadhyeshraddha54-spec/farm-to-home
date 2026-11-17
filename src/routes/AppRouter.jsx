import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import AdminLayout from '../layouts/AdminLayout'
import FarmerLayout from '../layouts/FarmerLayout'
import MainLayout from '../layouts/MainLayout'
import ErrorPage from '../pages/public/ErrorPage'
import HomePage from '../pages/public/HomePage'
import NotFoundPage from '../pages/public/NotFoundPage'
import ProductDetailPage from '../pages/public/ProductDetailPage'
import ProductsPage from '../pages/public/ProductsPage'
import { ROLES } from '../utils/constants'
import ActiveFarmerRoute from './ActiveFarmerRoute'
import GuestRoute from './GuestRoute'
import { PATHS } from './paths'
import ProtectedRoute from './ProtectedRoute'

// The store's main pages load immediately; everything else is downloaded
// only when first opened (smaller first load). The layouts show a spinner
// meanwhile (<Suspense> in MainLayout / DashboardLayout).
const page = (load, name = 'default') => lazy(() => load().then((m) => ({ default: m[name] })))

const LoginPage = page(() => import('../pages/public/LoginPage'))
const SignupPage = page(() => import('../pages/public/SignupPage'))
const ForgotPasswordPage = page(() => import('../pages/public/ForgotPasswordPage'))
const FarmsPage = page(() => import('../pages/public/FarmsPage'))
const FarmPage = page(() => import('../pages/public/FarmPage'))
const AccountPage = page(() => import('../pages/account/AccountPage'))

const CartPage = page(() => import('../pages/customer/CartPage'))
const CheckoutPage = page(() => import('../pages/customer/CheckoutPage'))
const OrdersPage = page(() => import('../pages/customer/OrdersPage'))
const OrderDetailPage = page(() => import('../pages/customer/OrderDetailPage'))

const infoPages = () => import('../pages/info/InfoPages')
const AboutPage = page(infoPages, 'AboutPage')
const PrivacyPolicyPage = page(infoPages, 'PrivacyPolicyPage')
const TermsPage = page(infoPages, 'TermsPage')
const ShippingPolicyPage = page(infoPages, 'ShippingPolicyPage')
const CancellationPolicyPage = page(infoPages, 'CancellationPolicyPage')
const ReturnsPolicyPage = page(infoPages, 'ReturnsPolicyPage')
const ContactPage = page(() => import('../pages/info/ContactPage'))

const FarmerOverviewPage = page(() => import('../pages/farmer/FarmerOverviewPage'))
const FarmerOrdersPage = page(() => import('../pages/farmer/FarmerOrdersPage'))
const FarmerProductsPage = page(() => import('../pages/farmer/FarmerProductsPage'))
const FarmProfilePage = page(() => import('../pages/farmer/FarmProfilePage'))
const ProductCreatePage = page(() => import('../pages/farmer/ProductCreatePage'))
const ProductEditPage = page(() => import('../pages/farmer/ProductEditPage'))

const AdminOverviewPage = page(() => import('../pages/admin/AdminOverviewPage'))
const AdminFarmersPage = page(() => import('../pages/admin/AdminFarmersPage'))
const AdminUsersPage = page(() => import('../pages/admin/AdminUsersPage'))
const AdminProductsPage = page(() => import('../pages/admin/AdminProductsPage'))
const AdminOrdersPage = page(() => import('../pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage = page(() => import('../pages/admin/AdminOrderDetailPage'))
const AdminCategoriesPage = page(() => import('../pages/admin/AdminCategoriesPage'))
const AdminMessagesPage = page(() => import('../pages/admin/AdminMessagesPage'))

const router = createBrowserRouter([
  // ---------- Store (header + footer) ----------
  {
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      // Anyone
      { path: PATHS.HOME, element: <HomePage /> },
      { path: PATHS.PRODUCTS, element: <ProductsPage /> },
      { path: PATHS.PRODUCT_DETAIL, element: <ProductDetailPage /> },
      { path: PATHS.FARMS, element: <FarmsPage /> },
      { path: PATHS.FARM_DETAIL, element: <FarmPage /> },
      { path: PATHS.CART, element: <CartPage /> },
      { path: PATHS.ABOUT, element: <AboutPage /> },
      { path: PATHS.CONTACT, element: <ContactPage /> },
      { path: PATHS.PRIVACY, element: <PrivacyPolicyPage /> },
      { path: PATHS.TERMS, element: <TermsPage /> },
      { path: PATHS.SHIPPING, element: <ShippingPolicyPage /> },
      { path: PATHS.CANCELLATION, element: <CancellationPolicyPage /> },
      { path: PATHS.RETURNS, element: <ReturnsPolicyPage /> },

      // Signed-out visitors only
      {
        element: <GuestRoute />,
        children: [
          { path: PATHS.LOGIN, element: <LoginPage /> },
          { path: PATHS.SIGNUP, element: <SignupPage /> },
          { path: PATHS.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
        ],
      },

      // Any signed-in user
      {
        element: <ProtectedRoute />,
        children: [{ path: PATHS.ACCOUNT, element: <AccountPage /> }],
      },

      // Customers only
      {
        element: <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]} />,
        children: [
          { path: PATHS.CHECKOUT, element: <CheckoutPage /> },
          { path: PATHS.ORDERS, element: <OrdersPage /> },
          { path: PATHS.ORDER_DETAIL, element: <OrderDetailPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // ---------- Farmer dashboard ----------
  {
    element: <ProtectedRoute allowedRoles={[ROLES.FARMER]} />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <FarmerLayout />,
        children: [
          // Any farmer, suspended or not
          { path: PATHS.FARMER, element: <FarmerOverviewPage /> },
          { path: PATHS.FARMER_ORDERS, element: <FarmerOrdersPage /> },
          { path: PATHS.FARMER_PRODUCTS, element: <FarmerProductsPage /> },
          { path: PATHS.FARMER_PROFILE, element: <FarmProfilePage /> },
          // Farmers who are not suspended
          {
            element: <ActiveFarmerRoute />,
            children: [
              { path: PATHS.FARMER_PRODUCT_NEW, element: <ProductCreatePage /> },
              { path: PATHS.FARMER_PRODUCT_EDIT, element: <ProductEditPage /> },
            ],
          },
        ],
      },
    ],
  },

  // ---------- Admin dashboard ----------
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: PATHS.ADMIN, element: <AdminOverviewPage /> },
          { path: PATHS.ADMIN_FARMERS, element: <AdminFarmersPage /> },
          { path: PATHS.ADMIN_USERS, element: <AdminUsersPage /> },
          { path: PATHS.ADMIN_PRODUCTS, element: <AdminProductsPage /> },
          { path: PATHS.ADMIN_ORDERS, element: <AdminOrdersPage /> },
          { path: PATHS.ADMIN_ORDER_DETAIL, element: <AdminOrderDetailPage /> },
          { path: PATHS.ADMIN_CATEGORIES, element: <AdminCategoriesPage /> },
          { path: PATHS.ADMIN_MESSAGES, element: <AdminMessagesPage /> },
        ],
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
