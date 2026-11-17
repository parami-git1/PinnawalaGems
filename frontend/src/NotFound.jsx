import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return <main id="main-content" className="pg-not-found">
    <span className="pg-not-found__number" aria-hidden="true">404</span>
    <p className="pg-not-found__eyebrow">Pinnawala Gems</p>
    <h1>A different path<br /><em>to your discovery.</em></h1>
    <p>This page could not be found. Explore our collection or return home to continue.</p>
    <div><Link to="/catalog">Explore the collection <span aria-hidden="true">↗</span></Link><Link to="/">Return home <span aria-hidden="true">→</span></Link></div>
  </main>;
}
