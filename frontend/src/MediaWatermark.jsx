import './MediaWatermark.css';

export default function MediaWatermark({ certificate = false }) {
  return <span className={`pg-media-watermark${certificate ? ' pg-media-watermark--certificate' : ''}`} aria-hidden="true">
    <img src="/images/perf-logo-320-v1.webp" width="320" height="187" alt="" draggable="false" />
  </span>;
}
