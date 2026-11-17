const controlled = {
  home: ['address', 'contactNumber', 'inquiryEmail', 'whatsappNumber', 'googleMapsLink', 'name', 'businessName', 'tagline', 'license', 'shipping', 'email', 'phone', 'phoneDisplay', 'mobileNumber', 'mobileNumber2', 'landlineNumber', 'landlineNumber2', 'secondaryPhone'],
  contact: ['address', 'landlineNumber', 'landlineNumber2', 'mobileNumber', 'mobileNumber2', 'email', 'googleMapsLink', 'name', 'businessName', 'tagline', 'license', 'shipping', 'inquiryEmail', 'phone', 'phoneDisplay', 'contactNumber', 'secondaryPhone', 'whatsappNumber'],
};

export const isAuthoritativeSetting = (page, name) => controlled[page]?.includes(name) || false;
export function editableSettings(page, data) {
  return Object.fromEntries(Object.entries(data || {}).filter(([name]) => !isAuthoritativeSetting(page, name) && !['_id', '__v', 'createdAt', 'updatedAt', 'topGems'].includes(name)));
}
