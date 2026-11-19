import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { API_BASE, useRemoteResource } from './hooks/useRemoteResource';
import './Feedback.css';
import FeedbackGallery from './FeedbackGallery';
import { FEEDBACK_STARTER } from './pageHeroAssets';

const DEFAULT_PHOTOS = [
  FEEDBACK_STARTER,
  '/images/lapidary-craft.webp',
  '/images/ceylon-landscape.webp',
];
const EMPTY_FORM = { name: '', review: '', rating: 0 };
const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const text = (value) => typeof value === 'string' ? value.trim() : '';

function validateReview({ name, review, rating }) {
  return {
    name: !text(name) ? 'Please enter your name.' : text(name).length < 2 || text(name).length > 100 ? 'Please use 2–100 characters for your name.' : '',
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? '' : 'Please select a rating from 1 to 5.',
    review: !text(review) ? 'Please tell us about your experience.' : text(review).length < 3 || text(review).length > 4000 ? 'Please use 3–4000 characters for your review.' : '',
  };
}

function Icon({ name = 'arrow', ...props }) {
  const paths = {
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    left: 'm14 6-6 6 6 6',
    right: 'm10 6 6 6-6 6',
    close: 'm6 6 12 12M6 18 18 6',
    check: 'm5 12 4 4L19 6',
    pause: 'M8 5v14M16 5v14',
    play: 'm8 5 11 7-11 7V5Z',
    lock: 'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4',
    user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM5 21a7 7 0 0 1 14 0H5Z',
    edit: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5M17 3l4 4-10 10H7v-4L17 3Z',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}

function Star({ filled = true }) {
  return <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true"><path d="m12 2.7 2.87 5.82 6.43.94-4.65 4.53 1.1 6.4L12 17.37l-5.75 3.02 1.1-6.4L2.7 9.46l6.43-.94L12 2.7Z" /></svg>;
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const change = () => setMatches(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, [query]);
  return matches;
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (type !== 'success') return undefined;
    const timer = window.setTimeout(onClose, 10000);
    return () => window.clearTimeout(timer);
  }, [type, onClose]);
  return <div className={`feedback-toast feedback-toast--${type}`} role={type === 'success' ? 'status' : 'alert'}>
    <span className="feedback-toast-icon"><Icon name={type === 'success' ? 'check' : 'close'} /></span>
    <p>{message}</p><button type="button" onClick={onClose} aria-label="Dismiss notification"><Icon name="close" /></button>
  </div>;
}

function ReviewCard({ feedback }) {
  const [expanded, setExpanded] = useState(false);
  const reviewId = useId();
  const review = text(feedback.review);
  const name = text(feedback.name) || 'Guest';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const rating = Math.max(0, Math.min(5, Number(feedback.rating) || 0));
  const date = new Date(feedback.createdAt);
  const validDate = !Number.isNaN(date.getTime());
  return <article className="feedback-review-card">
    <div className="feedback-review-top"><span className="feedback-review-stars" role="img" aria-label={`${rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= rating ? 'is-filled' : ''}><Star filled={star <= rating} /></span>)}</span><span className="feedback-quote-mark" aria-hidden="true">“</span></div>
    <blockquote id={reviewId} className={expanded ? 'is-expanded' : ''}>{review}</blockquote>
    {review.length > 220 && <button type="button" className="feedback-read-more" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls={reviewId}>{expanded ? 'Read less' : 'Read more'}</button>}
    <footer className="feedback-review-author"><span className="feedback-review-avatar" aria-hidden="true">{initials}</span><div><h3>{name}</h3>{validDate ? <time dateTime={date.toISOString()}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time> : <span>Guest review</span>}</div></footer>
  </article>;
}

export default function Feedback() {
  const { home } = useOutletContext();
  const resource = useRemoteResource('feedback');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [toast, setToast] = useState(null);
  const [reviewPage, setReviewPage] = useState(0);
  const submittingRef = useRef(false);
  const nameRef = useRef(null);
  const reviewRef = useRef(null);
  const ratingRef = useRef(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const smallScreen = useMediaQuery('(max-width: 639px)');
  const mediumScreen = useMediaQuery('(max-width: 1023px)');
  const perView = smallScreen ? 1 : mediumScreen ? 2 : 3;
  const activeRating = hoverRating || formData.rating;
  const displayFeedbacks = useMemo(() => Array.isArray(resource.data) ? resource.data.filter((feedback) => feedback && feedback.isApproved === true) : [], [resource.data]);
  const photos = useMemo(() => {
    const data = home.data || {};
    const customerPhotos = Array.isArray(data.customerPhotos) ? data.customerPhotos.map(text).filter(Boolean).slice(0, 4) : [];
    const configured = customerPhotos.length ? customerPhotos : [data.heroImage, data.featureImage].map(text).filter(Boolean);
    return configured.length ? [...new Set(configured)] : DEFAULT_PHOTOS;
  }, [home.data]);
  const maxPage = Math.max(0, displayFeedbacks.length - perView);
  const visibleSlots = Math.max(1, Math.min(perView, displayFeedbacks.length));
  const currentPage = Math.min(reviewPage, maxPage);
  const closeToast = useCallback(() => setToast(null), []);
  const validationErrors = validateReview(formData);
  const nameError = touched.name || submitAttempted ? validationErrors.name : '';
  const ratingError = touched.rating || submitAttempted ? validationErrors.rating : '';
  const reviewError = touched.review || submitAttempted ? validationErrors.review : '';
  const ratingLabel = activeRating
    ? `${activeRating} ${activeRating === 1 ? 'Star' : 'Stars'} — ${RATING_LABELS[activeRating - 1]}`
    : 'Select your rating';

  const handleChange = (event) => setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleBlur = (event) => setTouched((previous) => ({ ...previous, [event.target.name]: true }));
  const selectRating = (rating) => {
    setHoverRating(0);
    setFormData((previous) => ({ ...previous, rating }));
    setTouched((previous) => ({ ...previous, rating: true }));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    setToast(null);
    const payload = { name: formData.name.trim(), review: formData.review.trim(), rating: formData.rating };
    const errors = validateReview(payload);
    setSubmitAttempted(true);
    if (Object.values(errors).some(Boolean)) {
      const firstInvalid = errors.name ? nameRef : errors.rating ? ratingRef : reviewRef;
      window.requestAnimationFrame(() => firstInvalid.current?.focus());
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_BASE}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const error = new Error(typeof result.message === 'string' ? result.message : response.status === 429 ? 'Please wait a little before submitting another review.' : 'Submission failed — please try again.');
        error.fromServer = true;
        throw error;
      }
      setToast({ type: 'success', message: 'Thank you for sharing your experience! Your review has been submitted and is awaiting approval.' });
      setFormData(EMPTY_FORM);
      setHoverRating(0);
      setTouched({});
      setSubmitAttempted(false);
    } catch (error) {
      setToast({ type: 'error', message: error.fromServer ? error.message : 'We couldn’t send your review. Your words are saved here; please try again.' });
    } finally {
      window.clearTimeout(timeout);
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return <main id="main-content" className="pg-feedback">
    {toast && <Toast {...toast} onClose={closeToast} />}
    <div className="feedback-shell">
      <section className="feedback-hero" aria-labelledby="feedback-title">
        <FeedbackGallery photos={photos} reducedMotion={reducedMotion} Icon={Icon} />

        <div className="feedback-form-panel">
          <header className="feedback-form-heading">
            <p className="feedback-eyebrow">A considered conversation</p>
            <h2>Your experience is<br />part of our <em>story.</em></h2>
            <p>Share your experience with Pinnawala Gems. Your thoughts help us serve you better and inspire future guests.</p>
          </header>
          <form className="feedback-form" onSubmit={handleSubmit} noValidate aria-labelledby="feedback-form-title" aria-describedby="feedback-form-instructions feedback-privacy" aria-busy={isSubmitting}>
            <div className="feedback-form-intro">
              <h3 id="feedback-form-title">Share Your Experience</h3>
              <p id="feedback-form-instructions">All fields are required.</p>
            </div>

            <div className="feedback-field">
              <label htmlFor="feedback-name">Your name <span className="feedback-required" aria-hidden="true">*</span></label>
              <div className="feedback-field-control">
                <Icon name="user" />
                <input ref={nameRef} id="feedback-name" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} autoComplete="name" placeholder="Enter your name" minLength={2} maxLength={100} required disabled={isSubmitting} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'feedback-name-error' : undefined} />
              </div>
              {nameError && <p className="feedback-field-error" id="feedback-name-error">{nameError}</p>}
            </div>

            <fieldset className="feedback-rating" disabled={isSubmitting} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setTouched((previous) => ({ ...previous, rating: true })); }}>
              <legend id="feedback-rating-legend">Your rating <span className="feedback-required" aria-hidden="true">*</span></legend>
              <div className="feedback-rating-row">
                <div className="feedback-stars" role="radiogroup" aria-labelledby="feedback-rating-legend" aria-required="true" aria-invalid={Boolean(ratingError)} aria-describedby={`feedback-rating-label${ratingError ? ' feedback-rating-error' : ''}`} onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className={`feedback-star${activeRating >= rating ? ' is-filled' : ''}`} onMouseEnter={() => setHoverRating(rating)}>
                      <input ref={rating === 1 ? ratingRef : undefined} type="radio" name="rating" value={rating} checked={formData.rating === rating} onFocus={() => setHoverRating(0)} onChange={() => selectRating(rating)} aria-label={`${rating} ${rating === 1 ? 'star' : 'stars'}`} aria-describedby={ratingError ? 'feedback-rating-error' : undefined} required />
                      <Star filled={activeRating >= rating} />
                    </label>
                  ))}
                </div>
                <span className={`feedback-rating-label${!activeRating ? ' is-unselected' : ''}`} id="feedback-rating-label" aria-live="polite">{ratingLabel}</span>
              </div>
              {ratingError && <p className="feedback-field-error" id="feedback-rating-error">{ratingError}</p>}
            </fieldset>

            <div className="feedback-field">
              <label htmlFor="feedback-review">Your review <span className="feedback-required" aria-hidden="true">*</span></label>
              <div className="feedback-field-control feedback-field-control--review">
                <Icon name="edit" />
                <textarea ref={reviewRef} id="feedback-review" name="review" value={formData.review} onChange={handleChange} onBlur={handleBlur} placeholder="Tell us about your experience with Pinnawala Gems..." rows="4" minLength={3} maxLength={4000} required disabled={isSubmitting} aria-invalid={Boolean(reviewError)} aria-describedby={reviewError ? 'feedback-review-error' : undefined} />
              </div>
              {reviewError && <p className="feedback-field-error" id="feedback-review-error">{reviewError}</p>}
            </div>

            <div className="feedback-submit-area">
              <button type="submit" className="feedback-submit" disabled={isSubmitting}>
                {isSubmitting ? <><span className="feedback-spinner" aria-hidden="true" />Submitting…</> : <>Submit feedback<Icon /></>}
              </button>
              <div className="feedback-submit-notices" id="feedback-privacy">
                <p><Icon name="lock" />Reviews are published after approval.</p>
                <p>Your name will be shown with your approved review.</p>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="feedback-reviews" aria-labelledby="feedback-reviews-title">
        <header className="feedback-reviews-heading"><p className="feedback-eyebrow">Client Voices</p><h2 id="feedback-reviews-title">From Our <em>Guests</em></h2></header>
        {resource.status === 'loading' ? <div className="feedback-review-skeletons" aria-busy="true" aria-label="Loading reviews">{Array.from({ length: perView }, (_, index) => <div key={index}><span /><span /><span /><span /></div>)}</div>
          : resource.status === 'error' ? <div className="feedback-reviews-empty" role="alert"><p>We couldn’t load the reviews. Please try again.</p><button type="button" onClick={resource.retry}>Try again <Icon /></button></div>
            : displayFeedbacks.length === 0 ? <div className="feedback-reviews-empty"><span className="feedback-empty-quote" aria-hidden="true">“</span><p>Be the first to share your experience.</p></div>
              : <>
                <div className={`feedback-reviews-carousel${maxPage === 0 ? ' is-static' : ''}${displayFeedbacks.length === 1 ? ' is-single' : ''}`} aria-label="Guest reviews" aria-roledescription="carousel">
                  <button className="feedback-review-nav" type="button" aria-label="Previous review" onClick={() => setReviewPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}><Icon name="left" /></button>
                  <div className="feedback-reviews-viewport"><div className="feedback-reviews-track" style={{ transform: `translateX(calc(-${currentPage * (100 / visibleSlots)}% - ${currentPage * 20 / visibleSlots}px))` }}>{displayFeedbacks.map((feedback, index) => { const visible = index >= currentPage && index < currentPage + perView; return <div key={feedback._id} className="feedback-review-slide" aria-hidden={!visible} inert={!visible ? true : undefined} style={{ width: `calc(${100 / visibleSlots}% - ${(visibleSlots - 1) * 20 / visibleSlots}px)` }}><ReviewCard feedback={feedback} /></div>; })}</div></div>
                  <button className="feedback-review-nav" type="button" aria-label="Next review" onClick={() => setReviewPage(Math.min(maxPage, currentPage + 1))} disabled={currentPage === maxPage}><Icon name="right" /></button>
                </div>
                {maxPage > 0 && <div className="feedback-review-dots">{Array.from({ length: maxPage + 1 }, (_, index) => <button key={index} type="button" className={index === currentPage ? 'is-active' : ''} aria-label={`Go to review ${index + 1}`} aria-current={index === currentPage ? 'true' : undefined} onClick={() => setReviewPage(index)}><span /></button>)}</div>}
              </>}
      </section>
    </div>
  </main>;
}
