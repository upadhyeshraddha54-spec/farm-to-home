import { Link } from 'react-router'
import InfoLayout from '../../components/common/InfoLayout'
import { SITE } from '../../config/site'
import { PATHS } from '../../routes/paths'
import { APP_NAME, MAX_ORDER_ITEMS } from '../../utils/constants'

/*
 * About and policy pages. They describe how this marketplace actually works
 * (Cash on Delivery, farmer-run shipments, cancellation before confirmation).
 * Have them reviewed by a legal professional before launch, and keep
 * POLICIES_UPDATED in src/config/site.js current.
 */

const Contact = () => (
  <>
    the <Link to={PATHS.CONTACT}>Contact page</Link>
    {SITE.supportEmail && (
      <>
        {' '}or email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
      </>
    )}
  </>
)

const Operator = () => <>{SITE.legalName || APP_NAME}</>

export function AboutPage() {
  return (
    <InfoLayout title="About us" description="Farm To Home connects farmers directly with the people who eat their food." showUpdated={false}>
      <p>
        {APP_NAME} is an online marketplace where farmers sell their harvest directly to customers —
        vegetables, fruits, grains, pulses, dairy and more. Fewer middlemen means fresher food for
        you and a fairer price for the farmer.
      </p>
      <h2>How it works</h2>
      <ul>
        <li>Farmers create a free seller account and list what they grow, with photos, prices and stock.</li>
        <li>Farmers set their own prices and keep their stock up to date.</li>
        <li>You choose the farms you buy from — browse the farmer directory, read ratings from other customers, and order from several farms at once. Each farm packs and delivers its own part of your order, and you can track every shipment.</li>
        <li>You pay in cash when your items arrive.</li>
      </ul>
      <h2>Demo listings</h2>
      <p>
        Products marked “Demo” come from fictional example farms with illustrative prices. They show
        how the marketplace works and are not real offers from real farms.
      </p>
      <h2>Get in touch</h2>
      <p>Questions, ideas or want to sell with us? Use <Contact />.</p>
    </InfoLayout>
  )
}

export function ShippingPolicyPage() {
  return (
    <InfoLayout title="Shipping & delivery policy" description="How orders are packed, shipped and delivered on Farm To Home.">
      <h2>Who delivers</h2>
      <p>
        Every product is sold and delivered by the farm that listed it. If your order contains items
        from several farms, it arrives as separate shipments — one per farm — and you can follow each
        one on your order page: Placed → Confirmed → Shipped → Delivered.
      </p>
      <h2>Delivery charges</h2>
      <ul>
        <li>Orders of ₹500 or more (item total) have free delivery.</li>
        <li>Smaller orders have a delivery fee of ₹40, shown before you place the order.</li>
        <li>For orders from several farms, the delivery fee is paid with shipment 1. If shipment 1 is cancelled, the fee is not charged.</li>
      </ul>
      <h2>Delivery times</h2>
      <p>
        Farms confirm orders and ship them as soon as they can; fresh produce is usually packed
        close to dispatch. Times depend on the farm’s location and yours, so we don’t promise a fixed
        delivery date. Your order page shows the latest status of each shipment.
      </p>
      <h2>Your address</h2>
      <p>
        Please make sure your address, PIN code and mobile number are correct — the farm uses them to
        deliver and may call you. Your address is shared only with the farms in your order.
      </p>
      <h2>Order limits</h2>
      <p>One order can include up to {MAX_ORDER_ITEMS} different products. For more, simply place another order.</p>
      <h2>Questions</h2>
      <p>For help with a delivery, use <Contact /> and include your order number.</p>
    </InfoLayout>
  )
}

export function CancellationPolicyPage() {
  return (
    <InfoLayout title="Cancellation policy" description="When and how Farm To Home orders can be cancelled.">
      <h2>Cancelling as a customer</h2>
      <p>
        You can cancel your whole order from your order page until any farm confirms it. Once a farm
        has confirmed its part, the order can no longer be cancelled online — please contact us and
        we’ll help.
      </p>
      <h2>Cancellation by a farm</h2>
      <p>
        A farm may cancel its part of your order before shipping it — for example if the produce is
        no longer available or fit to sell. Other farms in your order are not affected. You will see
        the cancellation on your order page.
      </p>
      <h2>Payment</h2>
      <p>
        Because you pay Cash on Delivery, nothing is charged for cancelled items. Stock from cancelled
        items goes back to the farm automatically.
      </p>
      <h2>Questions</h2>
      <p>Use <Contact /> and include your order number.</p>
    </InfoLayout>
  )
}

export function ReturnsPolicyPage() {
  return (
    <InfoLayout title="Returns & refunds" description="What to do if something is wrong with your Farm To Home order.">
      <h2>Check your items at delivery</h2>
      <p>
        Most of what we sell is fresh and perishable, so please check your items when they arrive.
        As you pay Cash on Delivery, you can refuse items that are damaged, spoiled or not what you
        ordered, and you won’t pay for them.
      </p>
      <h2>Problems after delivery</h2>
      <p>
        If you find a problem after paying, contact us within 24 hours of delivery through <Contact />,
        with your order number and, if possible, a photo. We review every request with the farm.
      </p>
      <h2>Refunds</h2>
      <p>
        If a refund is approved, the farm or {SITE.legalName || APP_NAME} will refund the amount you
        paid for the affected items by bank transfer or UPI, and we will tell you when it has been
        sent. Delivery fees are refunded when the whole shipment was affected.
      </p>
      <h2>What can’t be returned</h2>
      <ul>
        <li>Perishable items that were accepted in good condition at delivery.</li>
        <li>Items damaged after delivery due to storage or handling.</li>
      </ul>
    </InfoLayout>
  )
}

export function PrivacyPolicyPage() {
  return (
    <InfoLayout title="Privacy policy" description="What personal data Farm To Home collects and how it is used.">
      <p>
        This policy explains what information <Operator /> collects when you use {APP_NAME}, how it is
        used and the choices you have.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address, optional mobile number and account type (customer or farmer).</li>
        <li><strong>Orders:</strong> the products you order, prices, your delivery address and phone number, and the status of each shipment.</li>
        <li><strong>Farm details (farmers):</strong> farm name, location, description and product listings, including photos you upload.</li>
        <li><strong>Reviews:</strong> the ratings and comments you post, shown publicly with your first name.</li>
        <li><strong>Messages:</strong> anything you send us through the Contact page.</li>
        <li><strong>On your device:</strong> your cart is stored in your browser’s local storage, and sign-in uses Firebase Authentication. We don’t use advertising or tracking cookies.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To run your account, take orders and get them delivered.</li>
        <li>To keep the marketplace safe, for example by suspending accounts that break our terms.</li>
        <li>To answer your questions.</li>
      </ul>
      <h2>Who we share it with</h2>
      <ul>
        <li><strong>Farms in your order</strong> see your name, delivery address, phone number and the items they need to deliver.</li>
        <li><strong>Service providers</strong> who host the service for us: Google Firebase (accounts and database) and Cloudinary (product photos).</li>
        <li>Authorities, when the law requires it.</li>
      </ul>
      <p>We do not sell your personal data.</p>
      <h2>Your choices</h2>
      <p>
        You can update your name, phone and saved address on your account page. To get a copy of your
        data or to close your account and delete your data, use <Contact />. Some order records may
        need to be kept for legal or accounting reasons.
      </p>
      <h2>Security</h2>
      <p>
        Access to data is controlled by security rules: customers see only their own orders, farmers
        see only orders for their products, and only administrators can manage the marketplace.
      </p>
      {SITE.grievanceOfficer && (
        <>
          <h2>Grievance officer</h2>
          <p>
            {SITE.grievanceOfficer}
            {SITE.supportEmail && <> · <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></>}
            {SITE.address && <> · {SITE.address}</>}
          </p>
        </>
      )}
    </InfoLayout>
  )
}

export function TermsPage() {
  return (
    <InfoLayout title="Terms of use" description="The rules for using the Farm To Home marketplace.">
      <p>
        These terms apply when you use {APP_NAME}, operated by <Operator />. By creating an account or
        placing an order you agree to them.
      </p>
      <h2>The marketplace</h2>
      <p>
        {APP_NAME} is a marketplace. Each product is sold by the farm that lists it; that farm is
        responsible for the product’s description, quality, price, packing and delivery. We may hide
        listings or suspend sellers who break these terms.
      </p>
      <h2>Accounts</h2>
      <ul>
        <li>Give accurate details and keep your password safe. You are responsible for activity on your account.</li>
        <li>We may block accounts used for fraud, abuse or repeated cancelled or refused orders.</li>
      </ul>
      <h2>Orders and payment</h2>
      <ul>
        <li>Prices are set by farmers and shown in Indian Rupees. The price and stock are checked again when you place an order.</li>
        <li>Payment is Cash on Delivery: you pay each farm when its shipment arrives.</li>
        <li>See our <Link to={PATHS.SHIPPING}>shipping</Link>, <Link to={PATHS.CANCELLATION}>cancellation</Link> and <Link to={PATHS.RETURNS}>returns</Link> policies.</li>
      </ul>
      <h2>For farmers</h2>
      <ul>
        <li>List only produce you grow or make, describe it honestly and keep stock accurate.</li>
        <li>Confirm, ship or cancel orders promptly, and follow food-safety laws that apply to you.</li>
        <li>Photos you upload must be yours or used with permission.</li>
      </ul>
      <h2>Reviews</h2>
      <p>
        You may review a product after it has been delivered to you. Keep reviews honest and
        respectful; we may remove reviews that are abusive, misleading or unrelated to the product.
      </p>
      <h2>Demo listings</h2>
      <p>Listings marked “Demo” are fictional examples and are not offers to sell.</p>
      <h2>Liability</h2>
      <p>
        To the extent the law allows, <Operator /> is not liable for indirect losses arising from use of
        the marketplace. Nothing in these terms limits your rights as a consumer under Indian law.
      </p>
      <h2>Changes and law</h2>
      <p>
        We may update these terms; the date above shows the latest version. These terms are governed by
        the laws of India. Questions? Use <Contact />.
      </p>
    </InfoLayout>
  )
}
