import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, Leaf, Pause, Play, ScanLine } from "lucide-react";
import { breedGallery, SLIDE_INTERVAL_MS } from "../breedGallery";

export default function HeroSlideshow({ copy, lang, reduceMotion, onBreed, imageStyle, noteStyle, active = true }) {
  const container = useRef(null);
  const toggle = useRef(null);
  const inView = useInView(container, { amount: 0.25 });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [failedImage, setFailedImage] = useState(null);
  const current = breedGallery[index];
  const playing = active && !reduceMotion && !paused && !hovered && pageVisible && inView && failedImage !== current.id;

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % breedGallery.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!active || !inView) return;
    const next = new Image();
    next.src = breedGallery[(index + 1) % breedGallery.length].image;
  }, [index, active, inView]);

  const move = (direction) => {
    setPaused(true);
    setIndex((value) => (value + direction + breedGallery.length) % breedGallery.length);
  };

  return (
    <div
      ref={container}
      className="hero-visual hero-slideshow"
      role="region"
      aria-roledescription={copy.carouselRole}
      aria-label={copy.carouselLabel}
      data-slide-index={index}
      data-playing={playing}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => { if (event.target !== toggle.current) setPaused(true); }}
    >
      <div className="hero-orbit" aria-hidden="true" />
      <div className="hero-carousel-controls">
        <button
          ref={toggle}
          type="button"
          onClick={() => setPaused((value) => !value)}
          disabled={reduceMotion}
          aria-label={reduceMotion ? copy.reducedSlideshow : (paused ? copy.playSlideshow : copy.pauseSlideshow)}
          title={reduceMotion ? copy.reducedSlideshow : (paused ? copy.playSlideshow : copy.pauseSlideshow)}
        >
          {paused || reduceMotion ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
        </button>
        <span className="hero-slide-count" aria-hidden="true">{String(index + 1).padStart(2, "0")} / {breedGallery.length}</span>
        <button type="button" onClick={() => move(-1)} aria-label={copy.previousPhoto}><ChevronLeft size={19} aria-hidden="true" /></button>
        <button type="button" onClick={() => move(1)} aria-label={copy.nextPhoto}><ChevronRight size={19} aria-hidden="true" /></button>
      </div>
      <motion.div className="hero-photo-frame" style={imageStyle} aria-live={playing ? "off" : "polite"}>
        <AnimatePresence initial={false}>
          <motion.div
            key={current.id}
            className="hero-slide"
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
          >
            <img className="hero-slide-backdrop" src={current.image} alt="" aria-hidden="true" />
            <img
              className="hero-photo"
              src={current.image}
              alt={copy.photoAlt.replace("{breed}", current.names[lang])}
              width="544"
              height="365"
              fetchpriority={index === 0 ? "high" : "auto"}
              onError={() => { setFailedImage(current.id); setPaused(true); }}
            />
            <div className="hero-photo-shade" aria-hidden="true" />
            <div className="hero-photo-caption">
              <span>{copy.supported}</span>
              <strong>{current.names[lang]}</strong>
            </div>
          </motion.div>
        </AnimatePresence>
        <span className="hero-collection-label"><Leaf size={15} aria-hidden="true" />{copy.fieldNote}</span>
        {failedImage === current.id && <p role="alert" className="hero-photo-error">{copy.photoError}</p>}
      </motion.div>
      <motion.div className="hero-note-layer" style={noteStyle}>
        <div className="home-glass hero-note">
          <span className="hero-note-icon"><ScanLine size={25} aria-hidden="true" /></span>
          <div><span className="hero-note-label">{copy.photoLabel}</span>
            <button className="home-text-link" onClick={() => onBreed(current.id)}>
              {copy.meetBreed}<ArrowUpRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.div>
      <span className="hero-edition">{reduceMotion ? copy.reducedSlideshow : copy.slideshowTiming}</span>
    </div>
  );
}
