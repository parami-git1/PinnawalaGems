export const GUIDE_DESTINATIONS = {
  overview: { label: 'Open Overview', view: 'analytics' },
  inventory: { label: 'Open gem inventory', view: 'inventory' },
  categories: { label: 'Open categories & banners', view: 'operations', section: 'catalog' },
  stock: { label: 'Open private stock', view: 'operations', section: 'stock' },
  ads: { label: 'Open event ads', view: 'operations', section: 'ads' },
  legacy: { label: 'Open older catalog', view: 'operations', section: 'legacy' },
  calendar: { label: 'Open calendar', view: 'planner', section: 'calendar' },
  appointments: { label: 'Open appointments', view: 'planner', section: 'appointments' },
  notes: { label: 'Open notes', view: 'planner', section: 'notes' },
  home: { label: 'Open homepage settings', view: 'settings', section: 'home' },
  contact: { label: 'Open contact settings', view: 'settings', section: 'contact' },
  reviews: { label: 'Open customer reviews', view: 'feedback' },
  workshop: { label: 'Open workshop posts', view: 'workshop' },
};

export function guideDestinationHref(portalPath, destination) {
  const target = Object.hasOwn(GUIDE_DESTINATIONS, destination) ? GUIDE_DESTINATIONS[destination] : null;
  if (!target || !/^\/workspace\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(portalPath)) throw new Error('Unknown guide destination.');
  const query = new URLSearchParams({ view: target.view });
  if (target.section) query.set('section', target.section);
  return `${portalPath}?${query}`;
}

const block = (title, ...steps) => ({ title, steps });

export const GUIDE_TOPICS = [
  {
    id: 'getting-started', title: 'Getting started', group: 'Start here', icon: 'home', illustration: 'workspace',
    summary: 'Find your way around and choose the right place for each task.',
    intro: 'Your admin workspace brings website content, private stock and daily customer work together. Start with the task you need to complete, then use the shortcuts in this guide to open the right screen.',
    destinations: ['overview', 'inventory', 'calendar'],
    blocks: [
      block('Your first five minutes', 'Open Overview to check private stock and website showcase totals separately.', 'Use Gem inventory for gemstones customers can see in the Collection. Use Operations → Stock inventory for private stock.', 'Use Appointments & notes to organise visits, tasks and reminders. Use Website settings, Customer reviews and Workshop posts for public content.', 'Choose a topic from the guide menu, or search for a task such as certificate, schedule or sold gems.'),
      block('The everyday workflow', 'Create the relevant category before adding its gemstones. Add accurate details and clear photographs, then save the record.', 'Wait for the success message before leaving an editor. Uploading a file alone does not save the form.', 'Use View website to inspect the public result in another tab. Sign out when you finish on a shared device.'),
    ],
    facts: [['Overview', 'Charts, totals, exact ID lookup and a finder for customer enquiries.'], ['Operations', 'Categories, private stock, adverts and the older catalog.'], ['Refresh data', 'Retrieves current records; a failed refresh displays a message rather than proving that stock is empty.']],
    note: 'Guide shortcuts open a workspace screen. They never create, publish, approve or delete records for you.', related: ['overview', 'gem-inventory', 'appointments'],
  },
  {
    id: 'overview', title: 'Charts & inventory totals', group: 'Start here', icon: 'chart', illustration: 'workspace',
    summary: 'Understand category colours, chart measures and the two record lists.',
    intro: 'Overview shows the business at a glance. Category donut and bar charts help you compare gemstones, while the finder lets you check what is available during a customer call.',
    destinations: ['overview', 'stock', 'inventory'],
    blocks: [
      block('Read the category charts', 'Choose Private stock or Website showcase in Gems by category. Each source has its own totals and category colours.', 'Choose Pieces, Gem records, Recorded carats or Recorded value (Rs.) from Measure.', 'For private stock, Available includes stock-counted records with available status and positive quantity. Choose All included to also review reserved, sold and zero-quantity records.', 'Select a category in the legend or comparison bars to filter the gemstone finder. Open View detailed totals for the full category ledger.'),
      block('Find a stone while speaking with a customer', 'Choose the record source, then combine category, colour, shape, carat range, availability and stock inclusion.', 'Open More gemstone details for cut, origin, treatment, certificate, price and website placement filters.', 'Read the matching quantities and recorded totals, then choose View / edit on a result. Reset filters to start a new enquiry.'),
    ],
    facts: [['Records vs pieces', 'One record can represent several pieces. These measures are different.'], ['Recorded carats / value', 'Totals use quantity × the recorded per-piece weight or price. Missing measurements are disclosed, not invented.'], ['Private stock vs showcase', 'The lists are separate. A gem recorded in both is counted within each list; adding their totals together can double-count physical stock.']],
    note: 'No private stock yet? Choose Website showcase to see charts for your public gemstones. If a list is unavailable, use Retry stock; an unavailable count is not zero.', related: ['quick-lookup', 'private-stock', 'homepage'],
  },
  {
    id: 'quick-lookup', title: 'Find a gemstone by ID', group: 'Start here', icon: 'search', illustration: 'gemstone',
    summary: 'Open the right record quickly and manage it from Overview.',
    intro: 'Quick Gem ID lookup searches both the website and private-stock lists independently of the finder filters. It is useful when a customer already has a gemstone reference.',
    destinations: ['overview', 'inventory', 'stock'],
    blocks: [
      block('Look up an existing reference', 'In Overview, find Quick Gem ID lookup. Paste the saved Gem ID or database record ID.', 'Press Enter to open a unique exact match. Suggested partial matches need an explicit selection.', 'If the same reference exists in both lists, choose the correct source. Check the source, title, photographs and details before editing.', 'Use the inspector to view details, open the public item link for a website record, edit the record or confirm a permanent deletion.'),
      block('Create or update without leaving Overview', 'Use the website/private-stock create options to open the relevant form.', 'Make the required changes, finish any uploads and save. Successful changes refresh the Overview figures.', 'If a save fails, keep the form open, check the message and retry. Cancel closes the draft without applying unsaved changes.'),
    ],
    note: 'Gem IDs are assigned automatically and remain with the record. Use its actual saved reference; do not create a replacement ID yourself. Human-readable references can be case-sensitive.', related: ['gem-inventory', 'private-stock', 'sold-gems'],
  },
  {
    id: 'gem-inventory', title: 'Add & manage website gems', group: 'Gem management', icon: 'gem', illustration: 'gemstone',
    summary: 'Create, find, edit and remove gemstones in the public Collection.',
    intro: 'Gem inventory manages public gemstone records. Its forms hold the gemstone details, media, certification and homepage presentation settings.',
    destinations: ['inventory', 'categories'],
    blocks: [
      block('Add a gemstone', 'Choose Add gemstone. Enter a Gem name and select an existing category. Create the category first if it is missing.', 'Add the description, origin, per-piece weight and price, colour, shape and cut where known. Enter quantity as a whole number of zero or more.', 'Add a cover photograph and any additional photos or videos. Complete the certificate section if applicable.', 'Choose whether the piece belongs in owned-stock totals. Set Featured gemstone, Homepage top gem and Homepage position only as needed.', 'Choose Create gemstone and wait for confirmation. Its Gem ID is generated automatically.'),
      block('Find and edit a record', 'Search by name or ID and select a category. Add colour, shape, certificate, weight or price filters as needed.', 'On phones, open More filters for additional fields. Edit/Delete actions are on the record cards. Desktop uses the inventory table.', 'Use sorting and page controls to browse results. Choose Edit, update the draft and Save changes. Clear filters restores the full list.'),
      block('Remove a record deliberately', 'Use Delete only when you intend to permanently remove that database record. Read the confirmation carefully.', 'For sold gemstones, use Remove sold gems instead if you need a checked batch and Undo. A quantity of zero is not a deletion or an archive.'),
    ],
    facts: [['Unknown price', 'Leave an optional price blank when it is not recorded. Zero is a real recorded value.'], ['Include in owned stock totals', 'An accounting choice. Clearing it does not hide a website record.'], ['Homepage position', 'Controls the existing display order. A position of 0 is supported.']],
    note: 'Saving a website gem can affect the public Collection. Check the selected source and record before saving.', related: ['media', 'homepage', 'sold-gems'],
  },
  {
    id: 'media', title: 'Photos, videos & certificates', group: 'Gem management', icon: 'image', illustration: 'media',
    summary: 'Upload files, select a cover, attach certificates and recover failed uploads.',
    intro: 'Use clear, accurate photographs of the actual gemstone. Image fields accept a file from your device, drag and drop, or an existing image URL.',
    destinations: ['inventory', 'categories', 'stock'],
    blocks: [
      block('Build a gemstone gallery', 'Open Add gemstone or Edit. In Photos & videos, choose photos or drop files in the upload area.', 'Wait for each upload to become ready. The first photo becomes the cover; choose Make cover on another photo to change it.', 'Add optional videos using the video upload control. Remove a gallery item if it should no longer be attached to this record.', 'For already hosted photographs, open Use existing image links and enter the cover URL or one additional image URL per line.', 'Save the gemstone after reviewing the final gallery. Uploading changes the draft, not the saved record.'),
      block('Add certification', 'Enable Has certificate when a certificate applies to this gemstone.', 'Drop or choose its certificate image, or paste its existing image URL. Enter the supporting certificate details.', 'Save the record. Customers can inspect the certificate in the item viewer; changing a certificate field does not generate or verify a laboratory certificate.'),
      block('Recover from an interrupted upload', 'Read the individual upload message. Retry a failed file after checking its format, size and your connection.', 'Use Cancel uploads to stop the active browser upload and queued files. Completed photos stay in the draft, and cancelled files can be retried individually.', 'Wait until uploads finish or cancellation releases the controls before saving or closing. Cancelling a request cannot guarantee that an already accepted server upload is undone.'),
    ],
    facts: [['Images', 'JPEG, PNG or WebP; up to 8 MB each.'], ['Website gemstone photos', 'Up to 10, including the cover photo.'], ['Website gemstone videos', 'Up to 2 optional MP4 or WebM files; up to 50 MB each.'], ['Other image fields', 'Category, stock, settings, advertisement and workshop image fields support a single image upload or URL.']],
    note: 'Removing an image from a draft or deleting a record does not automatically purge uploaded Cloudinary assets. Save the form to apply an attachment change.', related: ['gem-inventory', 'categories', 'workshops'],
  },
  {
    id: 'categories', title: 'Categories & collection banners', group: 'Gem management', icon: 'layers', illustration: 'media',
    summary: 'Organise public gemstones and maintain category thumbnails and wide banners.',
    intro: 'Public categories group gemstones in the Collection. Each category has a thumbnail and an optional wider banner; these images serve different layouts.',
    destinations: ['categories', 'inventory'],
    blocks: [
      block('Create or edit a category', 'Open Operations → Categories & homepage. Enter the category title, description and thumbnail image.', 'Upload or paste a separate Banner image when you want a custom wide Collection banner.', 'Save the category. Use Edit for the category details or Edit banner in the Collection banners overview to update a particular banner.', 'Keep the thumbnail when changing the wide banner. Review the public category after saving.'),
      block('Choose a suitable banner', 'Use a wide image; the editor recommends approximately 1800 × 600 pixels.', 'Keep the gemstone subject toward the right so the existing text area stays readable. Check the result on a phone as well as desktop.', 'Use the actual category and appropriate gemstone colour. The website can use its existing default artwork when no custom banner is set.'),
      block('Delete a category', 'Check every related gemstone before confirming Delete. Removing a public category also permanently removes its related public gemstone records.', 'Cancel the confirmation to keep the category. Uploaded assets are retained, but the database records do not have an Undo through this action.'),
    ],
    note: 'Public categories and private-stock categories are separate. Creating one does not create the other.', related: ['gem-inventory', 'private-stock', 'homepage'],
  },
  {
    id: 'private-stock', title: 'Private stock & availability', group: 'Gem management', icon: 'box', illustration: 'gemstone',
    summary: 'Track owned pieces, reservations, per-piece values and stock inclusion.',
    intro: 'Private stock is for internal inventory management. It does not publish a gemstone to the public Collection.',
    destinations: ['stock', 'overview', 'inventory'],
    blocks: [
      block('Create a stock category and gemstone', 'Open Operations → Stock inventory. Create a stock category with its title, description and image if needed.', 'In Stock stone details, choose the category and enter the gemstone name, photo, quantity and known specifications.', 'Record per-piece weight and price, origin, colour, shape, cut and treatment. Add certificate information where applicable.', 'Choose Available, Reserved or Sold. Keep Include in owned stock totals selected for pieces that belong in your accounting; clear it for reference or consignment records.', 'Save the stock stone. The reference is assigned automatically. Use its ID or specifications to find it again.'),
      block('Maintain accurate stock', 'Edit the existing record to change quantity, availability or details. Zero quantity and zero price are supported; unknown optional measurements can remain blank.', 'Check Overview for available pieces and recorded totals. The totals use quantity × per-piece measurements.', 'Use Remove sold gems for a reversible batch archive, or Delete for a confirmed permanent record removal. Deleting a stock category also removes all of its related stock stones.'),
    ],
    facts: [['Available', 'The record can contribute to available stock when quantity is positive and stock inclusion is enabled.'], ['Reserved / Sold', 'Retained in the list until removed; excluded from the Available chart selection.'], ['Stock categories', 'Create and delete are supported. Category renaming/editing is not currently provided.']],
    note: 'A private stock record and a website listing are independent. Update the corresponding public listing too when its public availability needs to change.', related: ['overview', 'sold-gems', 'gem-inventory'],
  },
  {
    id: 'homepage', title: 'Homepage gemstone selections', group: 'Gem management', icon: 'home', illustration: 'publication',
    summary: 'Choose homepage and featured gemstones without duplicating inventory.',
    intro: 'Homepage gemstone selections come from the public inventory. Use the presentation fields on the actual gemstone rather than creating a second record just for Home.',
    destinations: ['inventory', 'categories', 'home'],
    blocks: [
      block('Choose a gemstone for Home', 'Open a website gemstone in Gem inventory.', 'Enable Homepage top gem to include it in the homepage selection. Set Homepage position to control its existing ordering.', 'Use Featured gemstone when the piece should belong to the featured selection.', 'Save changes, then use View website to check the result. You can also manage homepage/featured flags in Operations → Categories & homepage.'),
      block('Review the selection', 'Use Overview’s Website showcase totals to see homepage and featured counts.', 'Use the finder’s website placement filter to inspect selected records.', 'Clear a presentation flag to remove that placement without deleting the gemstone from the public inventory.'),
    ],
    note: 'Homepage placement, stock inclusion and deletion are different controls. A placement flag does not transfer a gemstone between private stock and the website.', related: ['gem-inventory', 'overview', 'website-settings'],
  },
  {
    id: 'sold-gems', title: 'Remove sold gems & Undo', group: 'Gem management', icon: 'archive', illustration: 'archive',
    summary: 'Review exact IDs and archive sold records together with a way to restore them.',
    intro: 'Remove sold gems removes records from the active list without permanently deleting them or their photographs. Always review the exact records before confirming a batch.',
    destinations: ['inventory', 'stock'],
    blocks: [
      block('Review and remove a batch', 'Open Remove sold gems in the relevant inventory area. Confirm Website collection or Private stock in Remove from.', 'Paste up to 100 distinct saved Gem IDs or database record IDs. Separate them with new lines, spaces, commas or semicolons.', 'Choose Preview this batch. Repeated IDs count once. Correct unknown or ambiguous references before continuing.', 'Read the matched titles, IDs and source. Tick the confirmation only after checking the full batch, then choose Remove sold gems.', 'Read the result. Records changed since preview or failed records need a fresh review; do not assume every item was removed.'),
      block('Undo or recover an interrupted result', 'Use Undo last removal within its 24-hour window. Review the restore result; changed records are left unchanged for safety.', 'If the response was interrupted or the dialog was closed, preview the original IDs again. Unchanged archived records can appear in the explicit restore option.', 'A preview expires after 10 minutes. Generate a fresh preview if it expires. If a connection fails, check those IDs again before starting another batch.'),
    ],
    note: 'Permanent Delete is different: it removes database records and has no equivalent Undo. This batch tool archives records and keeps their media.', related: ['quick-lookup', 'private-stock', 'gem-inventory'],
  },
  {
    id: 'appointments', title: 'Calendar & appointments', group: 'Daily work', icon: 'calendar', illustration: 'calendar',
    summary: 'Plan visits, use category colours and review each day’s appointments and notes.',
    intro: 'The calendar shows appointments and dated notes together. Dates and appointment/reminder times use Sri Lanka time (UTC+05:30).',
    destinations: ['calendar', 'appointments', 'notes'],
    blocks: [
      block('Use the calendar', 'Open Appointments & notes. The calendar starts on Monday and shows a full month grid.', 'Choose a date to view that day’s appointments and notes in the agenda. Use month controls or Today to move around.', 'Choose an existing entry to inspect it. Use the selected-day add action to prefill the date for a new appointment or note.'),
      block('Create or update an appointment', 'Open Appointments and enter the customer name, date, time and a duration of at least 15 minutes.', 'Choose the appointment type and status. Add phone/email, purpose and internal notes as needed.', 'The type supplies a default calendar colour. Use the palette or custom colour input to override it, or Use category colour to restore the default.', 'Save and wait for confirmation. Search/filter the appointment list, edit a saved appointment, update its status or confirm deletion when appropriate.'),
    ],
    facts: [['Status', 'Requested, Confirmed, Completed, Cancelled and No-show describe the booking’s current state.'], ['Calendar vs list filters', 'List filters help find an appointment; they do not erase other dates from the calendar.'], ['Pending saves', 'Wait for completion before changing planner tabs or opening another editor.']],
    note: 'Creating an appointment does not automatically send an invitation, WhatsApp message or email to the customer.', related: ['notes', 'quick-lookup', 'access-help'],
  },
  {
    id: 'notes', title: 'Notes, tasks & reminders', group: 'Daily work', icon: 'note', illustration: 'calendar',
    summary: 'Keep customer details organised and understand exactly how reminders work.',
    intro: 'Notes hold internal information, follow-ups and tasks. A calendar date places a note in the calendar; a reminder is a separate timestamp for in-app activity.',
    destinations: ['notes', 'calendar'],
    blocks: [
      block('Create and organise a note', 'Open Notes. Enter a title and content, then choose General, Customer, Gem, Follow-up or Task.', 'Add customer name and tags where useful. Set a calendar date when the note belongs to a particular day.', 'Use the category colour or choose a custom colour. Pin important notes and save.', 'Use search, category and archived-note controls to find saved notes. Edit, pin/unpin, archive or delete the correct note as required.'),
      block('Set and manage a reminder', 'Add an optional Reminder date and time in Sri Lanka time. Save the note.', 'Open Notifications to see due reminders and upcoming activity. Upcoming reminders cover the next seven days.', 'Keep the workspace visible for approximately 30-second refreshes. Returning to the tab refreshes activity; polling pauses while it is hidden.', 'Clear/reschedule the reminder or archive the note when the follow-up is complete. A calendar date alone does not create a reminder.'),
    ],
    note: 'Reminders are in-app only. They do not send email, SMS, WhatsApp or background push notifications when the workspace is closed. Existing related-appointment links are retained; there is no Related appointment input to fill in.', related: ['appointments', 'access-help'],
  },
  {
    id: 'workshops', title: 'Workshop posts & scheduling', group: 'Daily work', icon: 'image', illustration: 'publication',
    summary: 'Prepare stories, schedule publication and add optional event and contact details.',
    intro: 'Workshop posts combine a photograph and story with optional event information. Publication time controls when the story appears; event time describes when the actual event happens.',
    destinations: ['workshop'],
    blocks: [
      block('Prepare a workshop story', 'Enter a title, description and workshop image. Drop a photograph, choose a file or use its existing URL.', 'Choose Publish now, Schedule publication or Save as draft. A draft remains private.', 'For a scheduled post, choose a future publication date/time in Sri Lanka time. An already due scheduled post can be edited without moving its original publication time.', 'Save and check the publication state. Use search and publication filters to find posts, then Edit or confirm Delete as needed.'),
      block('Add an optional event', 'Open the event details and enter an actual event date, with a time if needed. This is independent of the publication schedule.', 'Open location details for venue name, address and an optional full http(s) map URL.', 'Open contact details for separate call and WhatsApp numbers. Use a valid local Sri Lankan or international number.', 'Review the optional details before saving. Public call links open the phone app; WhatsApp links open a prepared workshop enquiry for the visitor to send.'),
    ],
    note: 'Future scheduled posts are hidden from the public list until their publication time. Visibility is checked on server reads, and an already open public workshop page refreshes periodically. A scheduled post does not send a customer notification.', related: ['media', 'appointments', 'website-settings'],
  },
  {
    id: 'reviews', title: 'Customer reviews', group: 'Daily work', icon: 'star', illustration: 'moderation',
    summary: 'Find pending feedback, approve it for publication or remove a review.',
    intro: 'Customer feedback requires approval before it is published. Review the name, rating and text before changing its status.',
    destinations: ['reviews'],
    blocks: [
      block('Review pending feedback', 'Open Customer reviews and choose Pending. Use Search reviews to find a name or phrase.', 'Read the complete feedback and rating, then choose Approve review when it should appear publicly.', 'Wait for the confirmation and check the Approved list. Only the selected record is approved.'),
      block('Remove a review', 'Choose Delete for the correct review and read the confirmation.', 'Cancel to retain the review, or confirm a permanent removal. If the request fails, the review remains visible so you can retry.', 'There is no unapprove control in the current panel. Delete is a permanent record action, so check the intended result carefully.'),
    ],
    note: 'The sidebar review count shows items awaiting approval. A loading or connection error does not mean that all reviews have been removed.', related: ['access-help'],
  },
  {
    id: 'website-settings', title: 'Homepage & contact settings', group: 'Website content', icon: 'settings', illustration: 'settings',
    summary: 'Edit page content, photo lists, announcements, hours and social links.',
    intro: 'Homepage and Contact settings are separate editors with separate Save buttons. Verified business contacts are centrally managed and shown read-only.',
    destinations: ['home', 'contact', 'inventory'],
    blocks: [
      block('Update the homepage', 'Open Homepage settings. Edit the hero heading and the available promotion imagery where required.', 'Add, replace or remove Customer photos in their intended order. Home uses the photo list; Feedback uses its first four photographs.', 'For an announcement, enter its text and optional link and enable Show announcement banner.', 'Manage homepage gemstone selections in Gem inventory, not as duplicate records in Settings.', 'Choose Save homepage and wait for confirmation. Use View page to inspect the result.'),
      block('Update contact page content', 'Open Contact page. Update opening hours and the available social profile links.', 'The verified address, email, telephone numbers and maps are read-only. Ask the website maintainer to update these centrally when the business details change.', 'Choose Save contact page. Saving Home does not save Contact, or vice versa.'),
      block('Understand stored legacy content', 'Stored legacy introduction keeps older brand-introduction text editable, but it is not displayed by the current homepage design.', 'Stored contact media keeps older photos/video editable. The current Contact page uses its curated banner rather than those stored media fields.', 'Changing these stored values does not add a new public section or replace the current Contact banner.'),
    ],
    note: 'The unsaved indicator means changes are still in the editor. If a save fails, keep the draft, read the error and retry. Wait for active image uploads before saving or switching pages.', related: ['homepage', 'media', 'access-help'],
  },
  {
    id: 'event-ads', title: 'Event advertisements', group: 'Website content', icon: 'image', illustration: 'publication',
    summary: 'Maintain advertisement records and their artwork and layout.',
    intro: 'Operations → Event ads manages stored advertisement entries. The public website decides which supported content placements are actually displayed.',
    destinations: ['ads', 'home', 'workshop'],
    blocks: [
      block('Create or maintain an advertisement', 'Open Event ads and enter a title, image and description.', 'Choose the supported horizontal or vertical layout. Upload an image, drop a file or paste an existing URL.', 'Save the record. Search the saved list, choose Edit to revise it, or confirm Delete to permanently remove that advertisement record.', 'Check the public page where the content is used. An advertisement record is separate from a Home announcement or a scheduled workshop post.'),
    ],
    note: 'Use Homepage settings for the Home announcement/promotion fields and Workshop posts for scheduled stories. Saving an advert does not schedule its publication or automatically add a new public placement.', related: ['website-settings', 'workshops', 'media'],
  },
  {
    id: 'older-catalog', title: 'Older catalog & variations', group: 'Website content', icon: 'layers', illustration: 'gemstone',
    summary: 'Maintain existing compatibility records and their variation photographs.',
    intro: 'Older gem catalog supports existing legacy entries. Use Gem inventory for the current public Collection rather than treating the older catalog as a second copy of it.',
    destinations: ['legacy', 'inventory'],
    blocks: [
      block('Edit a legacy entry', 'Open Operations → Older gem catalog. Search for the existing item and choose Edit.', 'Review title, category, primary colour, description and main image. Image fields accept upload/drop or a URL.', 'Add or remove variations as required. Each variation has a weight, design/cut name and up to 10 photo fields.', 'Review the remaining variations and photographs, then save. Removing a variation or photo from the draft takes effect when saved.'),
      block('Create or remove an older record', 'Use the older-catalog creation form only when this compatibility format is required.', 'Use Delete with confirmation to permanently remove the selected older record. Cancel edit discards unsaved changes to its draft.'),
    ],
    note: 'Private stock, current website gemstones and older-catalog records are separate data lists. Editing one does not synchronise the others.', related: ['gem-inventory', 'private-stock', 'media'],
  },
  {
    id: 'access-help', title: 'Access, saving & troubleshooting', group: 'Help & good practice', icon: 'shield', illustration: 'access',
    summary: 'Handle connection errors, protect access and avoid common mistakes.',
    intro: 'The workspace requires an authorised administrator session. This guide explains the visible controls; it never needs your password or a copy of an access token.',
    destinations: ['overview', 'inventory', 'calendar'],
    blocks: [
      block('Sign in and sign out', 'Use the administrator sign-in methods enabled for this website: email/password, the authorised Google account, or both.', 'Wait while the server verifies access. If verification is unavailable, use Try again rather than repeatedly submitting a new login.', 'A session can expire, and signing out in another browser tab clears that session. Sign in again when prompted.', 'Use Sign out in the sidebar when finished. Do not share passwords, administrator URLs or internal customer notes through a public enquiry.'),
      block('A page or image will not load', 'Read the displayed error and use its Retry or Try again control. Use Refresh data to request current workspace records.', 'Check your connection. A failed refresh can retain the last loaded data; treat it as potentially out of date.', 'For an image, verify the existing URL or retry a supported file. An upload error is different from a successful upload followed by an unsaved form.', 'If an error says a backend feature or endpoint is unavailable, contact the website maintainer with the screen name and visible error. Never send secrets or tokens.'),
      block('A save appears interrupted', 'Wait for the current action to finish. Save and Close may be locked during an upload or write to prevent conflicting changes.', 'Keep a failed-save draft open and correct the error before retrying. Avoid leaving an unsaved editor.', 'After an uncertain connection failure, refresh or look up the exact record to check whether the action completed before creating another copy.', 'For an interrupted sold batch, preview the original exact IDs again and review the recovery result.'),
    ],
    note: 'A success message confirms that the request completed. A spinner, a blank list or a connection error is not proof that a record was saved, removed or absent.', related: ['sold-gems', 'media', 'getting-started'],
  },
];

export function searchGuideTopics(query = '') {
  const words = String(query).trim().toLowerCase().split(/\s+/).filter(Boolean);
  return GUIDE_TOPICS.filter(topic => {
    const text = [topic.title, topic.summary, topic.intro, topic.note, ...(topic.facts || []).flat(), ...topic.blocks.flatMap(item => [item.title, ...item.steps])].join(' ').toLowerCase();
    return words.every(word => text.includes(word));
  });
}
