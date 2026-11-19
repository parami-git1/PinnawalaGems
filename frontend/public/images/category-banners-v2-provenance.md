# Category banner assets v2

Generated on 2026-11-19 using the built-in `image_gen` tool, one generation per asset. These AI-generated editorial images illustrate category colors; they do not depict specific inventory stones. No CLI or API-key fallback was used.

All five source images are 2172 × 724 pixels, with a faceted oval gemstone on the right and navy negative space on the left. Selected source PNGs are preserved in workspace `.tmp/category-banners-v2/selected-series/` (relative to the parent `pinnawala` workspace). Original generated files remain in `C:/Users/USER/.codex/generated_images/01a1f364-d238-7cc0-8735-16b02afd05a0/`.

Production copies are in `PinnawalaGems/frontend/public/images/`. They were resized without enlargement and encoded as WebP at quality 88, effort 6, with Sharp. No recoloring, hue rotation, compositing, or other visual substitution was applied. Width descriptors match actual encoded widths.

| Filename stem | 640 × 213 bytes | 1000 × 333 bytes | 1600 × 533 bytes |
| --- | ---: | ---: | ---: |
| `category-blue-sapphire-banner-v2-{640,1000,1600}.webp` | 9,396 | 19,678 | 43,884 |
| `category-yellow-sapphire-banner-v2-{640,1000,1600}.webp` | 11,842 | 23,480 | 48,570 |
| `category-orange-sapphire-banner-v2-{640,1000,1600}.webp` | 11,408 | 23,362 | 49,456 |
| `category-ruby-banner-v2-{640,1000,1600}.webp` | 8,230 | 17,428 | 38,506 |
| `category-pink-sapphire-banner-v2-{640,1000,1600}.webp` | 11,540 | 25,068 | 56,976 |

## Integration

`src/categoryBannerAssets.js` matches trimmed, case-insensitive category titles or slugs. Explicit custom covers remain preferred. Only the three exact previously observed legacy Cloudinary cover URLs for yellow, orange, and pink sapphire are superseded by the coordinated defaults; a changed URL, including a new Cloudinary version, remains a custom cover. Category records and production storage were not changed. `src/imageDelivery.js` registers responsive variants. `src/CollectionBanner.jsx` applies `gem-collection-banner--curated` to the generated series.

## Exact generation prompts and source files

### blue-sapphire

Original: `exec-525d3978-96bc-46c2-a5d2-374319f5ceb6.png`.

Workspace source copy: `.tmp/category-banners-v2/selected-series/blue-sapphire-source.png`.

Final production assets:

- `PinnawalaGems/frontend/public/images/category-blue-sapphire-banner-v2-640.webp`
- `PinnawalaGems/frontend/public/images/category-blue-sapphire-banner-v2-1000.webp`
- `PinnawalaGems/frontend/public/images/category-blue-sapphire-banner-v2-1600.webp`

Exact prompt:

```text
Use case: product-mockup. Asset type: premium gemstone category website banner, wide 3:1 landscape photography. Primary request: A single exceptionally beautiful royal BLUE SAPPHIRE, transparent deep cobalt blue oval faceted loose gemstone, physically credible precision facets and tiny natural inclusions, resting on a dark slate surface. Scene/backdrop: seamless near-black midnight navy studio backdrop and subtly textured navy slate foreground. Composition/framing: one gem on the RIGHT at 77 percent across the frame, occupies about one quarter of image width, low three-quarter macro camera angle, keep LEFT 60 percent quiet negative space and deep navy. Gem fully in frame, no other objects. Lighting/mood: restrained luxury jewelry campaign, soft diffused overhead key light, delicate cool edge light, crisp lifelike reflections and faceted color, soft natural contact shadow, subtle reflection. Style/medium: photorealistic high-end product photograph, realistic optics, professional macro lens, not CGI, not illustration. Color palette: midnight navy background consistent across a five-banner series; subject unambiguously royal sapphire blue. Constraints: wide panoramic banner 3:1, no text, letters, logos, watermarks, hands, jewelry settings, glitter effects, decorative gems, artificial glowing outline, or lens flare. Preserve quiet navy left space.
```

### yellow-sapphire

Original: `exec-0bd3065e-1d55-4be8-b298-a92b648f168f.png`.

Workspace source copy: `.tmp/category-banners-v2/selected-series/yellow-sapphire-source.png`.

Final production assets:

- `PinnawalaGems/frontend/public/images/category-yellow-sapphire-banner-v2-640.webp`
- `PinnawalaGems/frontend/public/images/category-yellow-sapphire-banner-v2-1000.webp`
- `PinnawalaGems/frontend/public/images/category-yellow-sapphire-banner-v2-1600.webp`

Exact prompt:

```text
Use case: product-mockup. Asset type: premium gemstone category website banner, wide 3:1 landscape photography. Primary request: A single exceptionally beautiful golden YELLOW SAPPHIRE, transparent vivid lemon-golden yellow oval faceted loose gemstone, physically credible precision facets and tiny natural inclusions, resting on a dark slate surface. Scene/backdrop: seamless near-black midnight navy studio backdrop and subtly textured navy slate foreground. Composition/framing: one gem on the RIGHT at 77 percent across the frame, occupies about one quarter of image width, low three-quarter macro camera angle, keep LEFT 60 percent quiet negative space and deep navy. Gem fully in frame, no other objects. Lighting/mood: restrained luxury jewelry campaign, soft diffused overhead key light, delicate cool edge light, crisp lifelike reflections and faceted color, soft natural contact shadow, subtle reflection. Style/medium: photorealistic high-end product photograph, realistic optics, professional macro lens, not CGI, not illustration. Color palette: midnight navy background consistent across a five-banner series; subject unambiguously bright yellow sapphire, no orange, no blue or green subject tint. Constraints: wide panoramic banner 3:1, no text, letters, logos, watermarks, hands, jewelry settings, glitter effects, decorative gems, artificial glowing outline, or lens flare. Preserve quiet navy left space.
```

### orange-sapphire

Original: `exec-3305f3b3-0a9e-44fc-93d9-92f3fc2c118b.png`.

Workspace source copy: `.tmp/category-banners-v2/selected-series/orange-sapphire-source.png`.

Final production assets:

- `PinnawalaGems/frontend/public/images/category-orange-sapphire-banner-v2-640.webp`
- `PinnawalaGems/frontend/public/images/category-orange-sapphire-banner-v2-1000.webp`
- `PinnawalaGems/frontend/public/images/category-orange-sapphire-banner-v2-1600.webp`

Exact prompt:

```text
Use case: product-mockup. Asset type: premium gemstone category website banner, wide 3:1 landscape photography. Primary request: A single exceptionally beautiful vivid ORANGE SAPPHIRE, transparent warm tangerine orange oval faceted loose gemstone, physically credible precision facets and tiny natural inclusions, resting on a dark slate surface. Scene/backdrop: seamless near-black midnight navy studio backdrop and subtly textured navy slate foreground. Composition/framing: one gem on the RIGHT at 77 percent across the frame, occupies about one quarter of image width, low three-quarter macro camera angle, keep LEFT 60 percent quiet negative space and deep navy. Gem fully in frame, no other objects. Lighting/mood: restrained luxury jewelry campaign, soft diffused overhead key light, delicate cool edge light, crisp lifelike reflections and faceted color, soft natural contact shadow, subtle reflection. Style/medium: photorealistic high-end product photograph, realistic optics, professional macro lens, not CGI, not illustration. Color palette: midnight navy background consistent across a five-banner series; subject unambiguously vivid orange sapphire, no yellow or pink subject tint. Constraints: wide panoramic banner 3:1, no text, letters, logos, watermarks, hands, jewelry settings, glitter effects, decorative gems, artificial glowing outline, or lens flare. Preserve quiet navy left space.
```

### ruby

Original: `exec-322f1e57-5cb2-43fe-9830-1f3f46f2cfc9.png`.

Workspace source copy: `.tmp/category-banners-v2/selected-series/ruby-source.png`.

Final production assets:

- `PinnawalaGems/frontend/public/images/category-ruby-banner-v2-640.webp`
- `PinnawalaGems/frontend/public/images/category-ruby-banner-v2-1000.webp`
- `PinnawalaGems/frontend/public/images/category-ruby-banner-v2-1600.webp`

Exact prompt:

```text
Use case: product-mockup. Asset type: premium gemstone category website banner, wide 3:1 landscape photography. Primary request: A single exceptionally beautiful fine RUBY, transparent vivid crimson pigeon-blood red oval faceted loose gemstone, physically credible precision facets and tiny natural inclusions, resting on a dark slate surface. Scene/backdrop: seamless near-black midnight navy studio backdrop and subtly textured navy slate foreground. Composition/framing: one gem on the RIGHT at 77 percent across the frame, occupies about one quarter of image width, low three-quarter macro camera angle, keep LEFT 60 percent quiet negative space and deep navy. Gem fully in frame, no other objects. Lighting/mood: restrained luxury jewelry campaign, soft diffused overhead key light, delicate cool edge light, crisp lifelike reflections and faceted color, soft natural contact shadow, subtle reflection. Style/medium: photorealistic high-end product photograph, realistic optics, professional macro lens, not CGI, not illustration. Color palette: midnight navy background consistent across a five-banner series; subject unambiguously rich ruby red, no orange or pink subject tint. Constraints: wide panoramic banner 3:1, no text, letters, logos, watermarks, hands, jewelry settings, glitter effects, decorative gems, artificial glowing outline, or lens flare. Preserve quiet navy left space.
```

### pink-sapphire

Original: `exec-51dffd2c-3517-49fb-bf60-cb4567bc571c.png`.

Workspace source copy: `.tmp/category-banners-v2/selected-series/pink-sapphire-source.png`.

Final production assets:

- `PinnawalaGems/frontend/public/images/category-pink-sapphire-banner-v2-640.webp`
- `PinnawalaGems/frontend/public/images/category-pink-sapphire-banner-v2-1000.webp`
- `PinnawalaGems/frontend/public/images/category-pink-sapphire-banner-v2-1600.webp`

Exact prompt:

```text
Use case: product-mockup. Asset type: premium gemstone category website banner, wide 3:1 landscape photography. Primary request: A single exceptionally beautiful fine PINK SAPPHIRE, transparent vivid rose pink oval faceted loose gemstone, physically credible precision facets and tiny natural inclusions, resting on a dark slate surface. Scene/backdrop: seamless near-black midnight navy studio backdrop and subtly textured navy slate foreground. Composition/framing: one gem on the RIGHT at 77 percent across the frame, occupies about one quarter of image width, low three-quarter macro camera angle, keep LEFT 60 percent quiet negative space and deep navy. Gem fully in frame, no other objects. Lighting/mood: restrained luxury jewelry campaign, soft diffused overhead key light, delicate cool edge light, crisp lifelike reflections and faceted color, soft natural contact shadow, subtle reflection. Style/medium: photorealistic high-end product photograph, realistic optics, professional macro lens, not CGI, not illustration. Color palette: midnight navy background consistent across a five-banner series; subject unambiguously vivid rose pink sapphire, clearly pink rather than ruby red or purple. Constraints: wide panoramic banner 3:1, no text, letters, logos, watermarks, hands, jewelry settings, glitter effects, decorative gems, artificial glowing outline, or lens flare. Preserve quiet navy left space.
```

