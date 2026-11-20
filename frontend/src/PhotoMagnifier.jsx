import { useEffect, useRef } from 'react';

const ZOOM = 2.5;

// Magnify the displayed photograph, including its watermark, as one surface.
// Using the image's real contain box keeps pointer mapping correct for portrait
// and landscape photos, padding, expanded dialogs and responsive resizing.
export default function PhotoMagnifier({ frameRef }) {
  const lensRef = useRef(null);
  const surfaceRef = useRef(null);
  const imageRef = useRef(null);
  const watermarkRef = useRef(null);

  useEffect(() => {
    const frame = frameRef.current;
    const lens = lensRef.current;
    const surface = surfaceRef.current;
    const mirror = imageRef.current;
    if (!frame || !lens || !surface || !mirror) return undefined;
    const finePointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    let pointer = null;
    let pending = null;

    const hide = () => {
      pointer = null;
      window.cancelAnimationFrame(pending);
      pending = null;
      lens.hidden = true;
      frame.removeAttribute('data-magnifying');
    };

    const paint = () => {
      pending = null;
      if (!pointer || !finePointer.matches) { lens.hidden = true; return; }
      const image = frame.querySelector(':scope > img.pg-responsive-image[data-image-state="ready"]');
      if (!image?.naturalWidth || !image.naturalHeight) { hide(); return; }
      const box = frame.getBoundingClientRect();
      const imageBox = image.getBoundingClientRect();
      const width = frame.clientWidth;
      const height = frame.clientHeight;
      if (!box.width || !box.height || !width || !height) { hide(); return; }
      const scaleX = box.width / width;
      const scaleY = box.height / height;
      const x = (pointer.x - box.left) / scaleX;
      const y = (pointer.y - box.top) / scaleY;
      const style = getComputedStyle(image);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const availableWidth = image.clientWidth - paddingX;
      const availableHeight = image.clientHeight - paddingY;
      const fit = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);
      const imageWidth = image.naturalWidth * fit;
      const imageHeight = image.naturalHeight * fit;
      // The viewer deliberately uses centered object-fit: contain. Its letterbox
      // area must not turn into an active, blank magnifier target.
      const left = (imageBox.left - box.left) / scaleX + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft) + (availableWidth - imageWidth) / 2;
      const top = (imageBox.top - box.top) / scaleY + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop) + (availableHeight - imageHeight) / 2;
      if (x < left || x > left + imageWidth || y < top || y > top + imageHeight) {
        lens.hidden = true;
        frame.removeAttribute('data-magnifying');
        return;
      }
      const source = image.currentSrc || image.src;
      if (mirror.src !== source) {
        lens.hidden = true;
        mirror.src = source;
      }
      if (!mirror.complete || !mirror.naturalWidth) return;
      const size = Math.min(188, width * 0.46, height * 0.46);
      lens.style.width = `${size}px`;
      lens.style.height = `${size}px`;
      lens.style.left = `${Math.max(0, Math.min(width - size, x - size / 2))}px`;
      lens.style.top = `${Math.max(0, Math.min(height - size, y - size / 2))}px`;
      surface.style.width = `${width}px`;
      surface.style.height = `${height}px`;
      surface.style.transform = `translate(${size / 2 - x * ZOOM}px, ${size / 2 - y * ZOOM}px) scale(${ZOOM})`;
      mirror.style.padding = style.padding;
      mirror.style.objectFit = style.objectFit;
      mirror.style.objectPosition = style.objectPosition;
      const watermark = frame.querySelector(':scope > .pg-media-watermark');
      const logo = watermark?.querySelector('img');
      if (watermark && logo && watermarkRef.current) {
        const markStyle = getComputedStyle(watermark);
        watermarkRef.current.style.width = markStyle.width;
        watermarkRef.current.style.height = markStyle.height;
        watermarkRef.current.style.opacity = markStyle.opacity;
        watermarkRef.current.style.filter = markStyle.filter;
        watermarkRef.current.style.backgroundImage = `url(${JSON.stringify(logo.currentSrc || logo.src)})`;
      }
      lens.hidden = false;
      frame.setAttribute('data-magnifying', 'true');
    };

    const schedule = () => { if (pending === null) pending = window.requestAnimationFrame(paint); };
    const move = (event) => {
      if (!finePointer.matches || !['mouse', 'pen'].includes(event.pointerType)) { hide(); return; }
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    const imageLoaded = () => { if (pointer) schedule(); };
    const imageFailed = () => { lens.hidden = true; frame.removeAttribute('data-magnifying'); };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(hide) : null;
    observer?.observe(frame);
    frame.addEventListener('pointermove', move, { passive: true });
    frame.addEventListener('pointerleave', hide);
    frame.addEventListener('pointercancel', hide);
    frame.addEventListener('pointerdown', hide);
    mirror.addEventListener('load', imageLoaded);
    mirror.addEventListener('error', imageFailed);
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('resize', hide);
    finePointer.addEventListener('change', hide);
    return () => {
      hide();
      observer?.disconnect();
      frame.removeEventListener('pointermove', move);
      frame.removeEventListener('pointerleave', hide);
      frame.removeEventListener('pointercancel', hide);
      frame.removeEventListener('pointerdown', hide);
      mirror.removeEventListener('load', imageLoaded);
      mirror.removeEventListener('error', imageFailed);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      finePointer.removeEventListener('change', hide);
    };
  }, [frameRef]);

  return <span ref={lensRef} className="pg-gem-magnifier" hidden aria-hidden="true">
    <span ref={surfaceRef} className="pg-gem-magnifier__surface">
      <img ref={imageRef} className="pg-gem-magnifier__image" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E" alt="" draggable="false" />
      <span ref={watermarkRef} className="pg-gem-magnifier__watermark" />
    </span>
  </span>;
}
