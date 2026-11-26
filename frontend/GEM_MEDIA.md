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
- Permanent gemstone/category deletion retains uploaded Cloudinary photos,
  videos and certificates because their URLs may also be used by other records
  or page content. Removing a gallery entry detaches its URL from the record;
  uploading alone does not save the gemstone. Sold-batch removal remains a
  reversible archive with Undo. No automatic asset purge is performed.

## Deployment

After explicit authorization, deploy the approved Git source to **Render first,
then Vercel**, using the matching backend/frontend revisions. No ZIP is needed.
Follow [the release checklist](../RELEASE_CHECKLIST.md). Preserve current Render
environment variables, database records and existing Cloudinary assets; exclude
real `.env`, uploads, dependencies and build output from source staging.

The public backend health response includes `gem-media` in `features` after this
revision is deployed. Without credentials, `POST /api/media/upload` returns 401;
404 indicates that the new route has not been deployed. Real upload/write tests
require separately authorized test records and actions after deployment.

## Verification

Backend integration tests use the real Express/Multer routes with synthetic
Cloudinary and database operations. They cover photo/video formats, exact byte
limits, oversize rejection, authentication, invalid files, temporary-file cleanup,
create/edit/read persistence and old records. Browser checks intercept every API
request and use synthetic records; they do not upload to production Cloudinary,
sign in to production, or write real inventory.

26 November admin audit: complete backend suite **125/125** and **11/11** focused
admin media scenarios passed, including cancellation/retry and 320/390/768/1440px
layouts. See [the complete admin report](ADMIN_UI_REFINEMENT.md). Real deployed
Cloudinary/provider/network behavior remains PENDING.
The production frontend build and targeted ESLint checks also passed. Browser
reports and screenshots are in workspace `.tmp/admin-gem-media-qa/` and
`.tmp/gem-media-gallery-qa/`.
