import { Link } from 'react-router'
import InfoLayout from '../../components/common/InfoLayout'
import { SITE } from '../../config/site'
import { PATHS } from '../../routes/paths'
import { APP_NAME, MAX_ORDER_ITEMS } from '../../utils/constants'
import { t, tx } from '../../i18n'

/*
 * About and policy pages. They describe how this marketplace actually works
 * (Cash on Delivery, farmer-run shipments, cancellation before confirmation).
 * Have them reviewed by a legal professional before launch, and keep
 * POLICIES_UPDATED in src/config/site.js current.
 */

// "the Contact page (or email …)" — used inside translated sentences as {contact}.
const contactLink = (text) => <Link to={PATHS.CONTACT}>{text}</Link>
const Contact = () =>
  SITE.supportEmail
    ? tx('the <link>Contact page</link> or email {email}', {
        link: contactLink,
        email: <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>,
      })
    : tx('the <link>Contact page</link>', { link: contactLink })

const operator = () => SITE.legalName || APP_NAME

export function AboutPage() {
  return (
    <InfoLayout title={t('About us')} description={t('Farm To Home connects farmers directly with the people who eat their food.')} showUpdated={false}>
      <p>
        {t('{app} is an online marketplace where farmers sell their harvest directly to customers — vegetables, fruits, grains, pulses, dairy and more. Fewer middlemen means fresher food for you and a fairer price for the farmer.', { app: APP_NAME })}
      </p>
      <h2>{t('How it works')}</h2>
      <ul>
        <li>{t('Farmers create a free seller account and list what they grow, with photos, prices and stock.')}</li>
        <li>{t('Farmers set their own prices and keep their stock up to date.')}</li>
        <li>{t('You choose the farms you buy from — browse the farmer directory, read ratings from other customers, and order from several farms at once. Each farm packs and delivers its own part of your order, and you can track every shipment.')}</li>
        <li>{t('You pay in cash when your items arrive.')}</li>
      </ul>
      <h2>{t('Demo listings')}</h2>
      <p>
        {t('Products marked “Demo” come from fictional example farms with illustrative prices. They show how the marketplace works and are not real offers from real farms.')}
      </p>
      <h2>{t('Get in touch')}</h2>
      <p>{tx('Questions, ideas or want to sell with us? Use {contact}.', { contact: <Contact /> })}</p>
    </InfoLayout>
  )
}

export function ShippingPolicyPage() {
  return (
    <InfoLayout title={t('Shipping & delivery policy')} description={t('How orders are packed, shipped and delivered on Farm To Home.')}>
      <h2>{t('Who delivers')}</h2>
      <p>
        {t('Every product is sold and delivered by the farm that listed it. If your order contains items from several farms, it arrives as separate shipments — one per farm — and you can follow each one on your order page: Placed → Confirmed → Shipped → Delivered.')}
      </p>
      <h2>{t('Delivery charges')}</h2>
      <ul>
        <li>{t('Orders of ₹500 or more (item total) have free delivery.')}</li>
        <li>{t('Smaller orders have a delivery fee of ₹40, shown before you place the order.')}</li>
        <li>{t('For orders from several farms, the delivery fee is paid with shipment 1. If shipment 1 is cancelled, the fee is not charged.')}</li>
      </ul>
      <h2>{t('Delivery times')}</h2>
      <p>
        {t('Farms confirm orders and ship them as soon as they can; fresh produce is usually packed close to dispatch. Times depend on the farm’s location and yours, so we don’t promise a fixed delivery date. Your order page shows the latest status of each shipment.')}
      </p>
      <h2>{t('Your address')}</h2>
      <p>
        {t('Please make sure your address, PIN code and mobile number are correct — the farm uses them to deliver and may call you. Your address is shared only with the farms in your order.')}
      </p>
      <h2>{t('Order limits')}</h2>
      <p>{t('One order can include up to {count} different products. For more, simply place another order.', { count: MAX_ORDER_ITEMS })}</p>
      <h2>{t('Questions')}</h2>
      <p>{tx('For help with a delivery, use {contact} and include your order number.', { contact: <Contact /> })}</p>
    </InfoLayout>
  )
}

export function CancellationPolicyPage() {
  return (
    <InfoLayout title={t('Cancellation policy')} description={t('When and how Farm To Home orders can be cancelled.')}>
      <h2>{t('Cancelling as a customer')}</h2>
      <p>
        {t('You can cancel your whole order from your order page until any farm confirms it. Once a farm has confirmed its part, the order can no longer be cancelled online — please contact us and we’ll help.')}
      </p>
      <h2>{t('Cancellation by a farm')}</h2>
      <p>
        {t('A farm may cancel its part of your order before shipping it — for example if the produce is no longer available or fit to sell. Other farms in your order are not affected. You will see the cancellation on your order page.')}
      </p>
      <h2>{t('Payment')}</h2>
      <p>
        {t('Because you pay Cash on Delivery, nothing is charged for cancelled items. Stock from cancelled items goes back to the farm automatically.')}
      </p>
      <h2>{t('Questions')}</h2>
      <p>{tx('Use {contact} and include your order number.', { contact: <Contact /> })}</p>
    </InfoLayout>
  )
}

export function ReturnsPolicyPage() {
  return (
    <InfoLayout title={t('Returns & refunds')} description={t('What to do if something is wrong with your Farm To Home order.')}>
      <h2>{t('Check your items at delivery')}</h2>
      <p>
        {t('Most of what we sell is fresh and perishable, so please check your items when they arrive. As you pay Cash on Delivery, you can refuse items that are damaged, spoiled or not what you ordered, and you won’t pay for them.')}
      </p>
      <h2>{t('Problems after delivery')}</h2>
      <p>
        {tx('If you find a problem after paying, contact us within 24 hours of delivery through {contact}, with your order number and, if possible, a photo. We review every request with the farm.', { contact: <Contact /> })}
      </p>
      <h2>{t('Refunds')}</h2>
      <p>
        {t('If a refund is approved, the farm or {operator} will refund the amount you paid for the affected items by bank transfer or UPI, and we will tell you when it has been sent. Delivery fees are refunded when the whole shipment was affected.', { operator: operator() })}
      </p>
      <h2>{t('What can’t be returned')}</h2>
      <ul>
        <li>{t('Perishable items that were accepted in good condition at delivery.')}</li>
        <li>{t('Items damaged after delivery due to storage or handling.')}</li>
      </ul>
    </InfoLayout>
  )
}

export function PrivacyPolicyPage() {
  return (
    <InfoLayout title={t('Privacy policy')} description={t('What personal data Farm To Home collects and how it is used.')}>
      <p>
        {t('This policy explains what information {operator} collects when you use {app}, how it is used and the choices you have.', { operator: operator(), app: APP_NAME })}
      </p>
      <h2>{t('What we collect')}</h2>
      <ul>
        <li><strong>{t('Account details:')}</strong>{' '}{t('your name, email address, optional mobile number and account type (customer or farmer).')}</li>
        <li><strong>{t('Orders:')}</strong>{' '}{t('the products you order, prices, your delivery address and phone number, and the status of each shipment.')}</li>
        <li><strong>{t('Farm details (farmers):')}</strong>{' '}{t('farm name, location, description and product listings, including photos you upload.')}</li>
        <li><strong>{t('Reviews:')}</strong>{' '}{t('the ratings and comments you post, shown publicly with your first name.')}</li>
        <li><strong>{t('Messages:')}</strong>{' '}{t('anything you send us through the Contact page.')}</li>
        <li><strong>{t('On your device:')}</strong>{' '}{t('your cart is stored in your browser’s local storage, and sign-in uses Firebase Authentication. We don’t use advertising or tracking cookies.')}</li>
      </ul>
      <h2>{t('How we use it')}</h2>
      <ul>
        <li>{t('To run your account, take orders and get them delivered.')}</li>
        <li>{t('To keep the marketplace safe, for example by suspending accounts that break our terms.')}</li>
        <li>{t('To answer your questions.')}</li>
      </ul>
      <h2>{t('Who we share it with')}</h2>
      <ul>
        <li><strong>{t('Farms in your order')}</strong>{' '}{t('see your name, delivery address, phone number and the items they need to deliver.')}</li>
        <li><strong>{t('Service providers')}</strong>{' '}{t('who host the service for us: Google Firebase (accounts and database) and Cloudinary (product photos).')}</li>
        <li>{t('Authorities, when the law requires it.')}</li>
      </ul>
      <p>{t('We do not sell your personal data.')}</p>
      <h2>{t('Your choices')}</h2>
      <p>
        {tx('You can update your name, phone and saved address on your account page. To get a copy of your data or to close your account and delete your data, use {contact}. Some order records may need to be kept for legal or accounting reasons.', { contact: <Contact /> })}
      </p>
      <h2>{t('Security')}</h2>
      <p>
        {t('Access to data is controlled by security rules: customers see only their own orders, farmers see only orders for their products, and only administrators can manage the marketplace.')}
      </p>
      {SITE.grievanceOfficer && (
        <>
          <h2>{t('Grievance officer')}</h2>
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
    <InfoLayout title={t('Terms of use')} description={t('The rules for using the Farm To Home marketplace.')}>
      <p>
        {t('These terms apply when you use {app}, operated by {operator}. By creating an account or placing an order you agree to them.', { app: APP_NAME, operator: operator() })}
      </p>
      <h2>{t('The marketplace')}</h2>
      <p>
        {t('{app} is a marketplace. Each product is sold by the farm that lists it; that farm is responsible for the product’s description, quality, price, packing and delivery. We may hide listings or suspend sellers who break these terms.', { app: APP_NAME })}
      </p>
      <h2>{t('Accounts')}</h2>
      <ul>
        <li>{t('Give accurate details and keep your password safe. You are responsible for activity on your account.')}</li>
        <li>{t('We may block accounts used for fraud, abuse or repeated cancelled or refused orders.')}</li>
      </ul>
      <h2>{t('Orders and payment')}</h2>
      <ul>
        <li>{t('Prices are set by farmers and shown in Indian Rupees. The price and stock are checked again when you place an order.')}</li>
        <li>{t('Payment is Cash on Delivery: you pay each farm when its shipment arrives.')}</li>
        <li>
          {tx('See our <shipping>shipping</shipping>, <cancel>cancellation</cancel> and <returns>returns</returns> policies.', {
            shipping: (text) => <Link to={PATHS.SHIPPING}>{text}</Link>,
            cancel: (text) => <Link to={PATHS.CANCELLATION}>{text}</Link>,
            returns: (text) => <Link to={PATHS.RETURNS}>{text}</Link>,
          })}
        </li>
      </ul>
      <h2>{t('For farmers')}</h2>
      <ul>
        <li>{t('List only produce you grow or make, describe it honestly and keep stock accurate.')}</li>
        <li>{t('Confirm, ship or cancel orders promptly, and follow food-safety laws that apply to you.')}</li>
        <li>{t('Photos you upload must be yours or used with permission.')}</li>
      </ul>
      <h2>{t('Reviews')}</h2>
      <p>
        {t('You may review a product after it has been delivered to you. Keep reviews honest and respectful; we may remove reviews that are abusive, misleading or unrelated to the product.')}
      </p>
      <h2>{t('Demo listings')}</h2>
      <p>{t('Listings marked “Demo” are fictional examples and are not offers to sell.')}</p>
      <h2>{t('Liability')}</h2>
      <p>
        {t('To the extent the law allows, {operator} is not liable for indirect losses arising from use of the marketplace. Nothing in these terms limits your rights as a consumer under Indian law.', { operator: operator() })}
      </p>
      <h2>{t('Changes and law')}</h2>
      <p>
        {tx('We may update these terms; the date above shows the latest version. These terms are governed by the laws of India. Questions? Use {contact}.', { contact: <Contact /> })}
      </p>
    </InfoLayout>
  )
}
