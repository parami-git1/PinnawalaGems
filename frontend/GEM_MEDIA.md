# Gemstone photos and videos

The Gem inventory Add/Edit form supports selecting or dropping several photos
at once and adding optional videos. Uploads run one at a time with file progress,
processing status and individual retry controls. Successful files stay in the
gallery if another file fails. Save and dismissal are disabled during an upload.

| Media | Maximum per gemstone | Maximum per file | Formats |
| --- | --- | --- | --- |
| Photos, including the collection cover | 10 | 8 MB (8 × 1024² bytes) | JPEG, PNG, WebP |
| Optional videos | 2 | 50 MB (50 × 1024² bytes) | MP4, WebM |

Choose **Make cover** to change the collection photograph; remove controls detach
an item from the gemstone. Existing hosted image links remain available in the
collapsed link section. A photograph is required; videos are optional.

Opening a collection item shows all photographs and videos together in the
detail gallery. Thumbnail selection, previous/next buttons, keyboard navigation
and photo swipes are supported. Photos can be enlarged in a dialog. Videos have
native playback controls, inline playback and no autoplay. Leaving the video
pauses playback. Old gems without videos continue to show their photographs.

## Backend contract

- `POST /api/media/upload`: authenticated multipart upload with one `file` field.
  The admin UI sends selected files sequentially. Success is HTTP 201 with
  `{ url, resourceType, bytes, publicId, width, height, duration? }`.
- The backend enforces file size, declared type and file signatures before
  uploading. Temporary disk files are removed on success and failure. Errors
  use JSON messages, including HTTP 413 for oversized files.
- Images use Cloudinary's image resource type and videos use its video resource
  type. See the [official Cloudinary upload documentation](https://cloudinary.com/documentation/node_image_and_video_upload).
  No new Cloudinary account or secret names are required.
- Inventory records retain `image` and `additionalImages` and add optional
  `videos: string[]`. Create/edit endpoints normalize and validate media URLs and
  counts. Missing video fields preserve existing media on partial edits. Legacy
  records and root-relative image paths remain supported; no database migration
  is required.
- Removing a gemstone or its category also removes attached Cloudinary videos
  using the video resource type. Removing a gallery entry detaches the URL from
  the record; uploading alone does not save the gemstone.

## Deployment

Deploy **both** the frontend and backend for this feature. The updated backend
package is `deliverables/pinnawala-gem-media-backend.zip` in the workspace. It
contains a `backend/` directory including the earlier appointments/notes fixes,
new upload route, media utility, schema and tests. It excludes `.env`, uploads,
dependencies and Git metadata. Keep the current Render environment variables.

The public backend health response includes `gem-media` in `features` after this
revision is deployed. Without credentials, `POST /api/media/upload` returns 401;
404 indicates that the new route has not been deployed. Use existing authorised
business records for a real upload after deployment.

## Verification

Backend integration tests use the real Express/Multer routes with synthetic
Cloudinary and database operations. They cover photo/video formats, exact byte
limits, oversize rejection, authentication, invalid files, temporary-file cleanup,
create/edit/read persistence and old records. Browser checks intercept every API
request and use synthetic records; they do not upload to production Cloudinary,
sign in to production, or write real inventory.

Final verification passed: 24 backend integration tests, 9 admin upload browser
checks and 43 customer-gallery browser checks at desktop, 390px and 320px widths.
The production frontend build and targeted ESLint checks also passed. Browser
reports and screenshots are in workspace `.tmp/admin-gem-media-qa/` and
`.tmp/gem-media-gallery-qa/`.
