const address = 'No.348, Main Street, Eheliyagoda, Eheliyagoda, Sri Lanka';
const name = 'Pinnawala Gems & Lapidary';

// Owner-confirmed public details take precedence over older API records.
export const BUSINESS = Object.freeze({
  name,
  address,
  email: 'Pinnawalagemsandlapidary@gmail.com',
  phone: '+94769254499',
  phoneDisplay: '0769254499',
  whatsapp: '94778307334',
  secondaryPhone: '+94778307334',
  tagline: 'Sapphire Stones specialist in Sri Lanka',
  license: 'Sri Lanka Gem Cooperation licensed company.',
  shipping: 'Worldwide Shipping',
  location: 'Eheliyagoda, Sri Lanka',
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`,
  mapsEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`,
});

export function withBusinessDetails(data, kind = 'home') {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  return {
    ...source,
    name: BUSINESS.name,
    businessName: BUSINESS.name,
    tagline: BUSINESS.tagline,
    license: BUSINESS.license,
    shipping: BUSINESS.shipping,
    address: BUSINESS.address,
    email: BUSINESS.email,
    inquiryEmail: BUSINESS.email,
    phone: BUSINESS.phone,
    phoneDisplay: BUSINESS.phoneDisplay,
    contactNumber: BUSINESS.phoneDisplay,
    mobileNumber: BUSINESS.phoneDisplay,
    mobileNumber2: BUSINESS.secondaryPhone,
    landlineNumber: '',
    landlineNumber2: '',
    secondaryPhone: BUSINESS.secondaryPhone,
    whatsappNumber: BUSINESS.whatsapp,
    googleMapsLink: kind === 'contact' ? BUSINESS.mapsEmbedUrl : BUSINESS.mapsUrl,
  };
}
