import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Camera, Check,
  ChevronDown, FileDown, Focus, Globe, Leaf, MapPin, ScanLine, Sun,
} from "lucide-react";
import { featuredBreeds, homeContent } from "../homeContent";
import "../home.css";

const stepIcons = [Camera, ScanLine, BookOpen];
const tipIcons = [Focus, Sun, Check];

function GlassCard({ children, className = "", interactiveMotion, ...props }) {
  const resetTilt = (event) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  };

  const tilt = (event) => {
    if (!interactiveMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    event.currentTarget.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(x - 0.5) * 5}deg`);
    event.currentTarget.style.setProperty("--glow-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--glow-y", `${y * 100}%`);
  };

  return (
    <div
      {...props}
      className={`home-glass ${className}`}
      onPointerMove={tilt}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
    >
      {children}
    </div>
  );
}

export default function HomePage({ lang, onIdentify, onExplore, onBreed, reduceMotion = true }) {
  const copy = homeContent[lang];
  const [finePointer, setFinePointer] = useState(false);
  const hero = useRef(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 42]);
  const imageRotate = useTransform(scrollYProgress, [0, 1], [0, 4]);
  const noteY = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const interactiveMotion = finePointer && !reduceMotion;

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className="homepage" data-motion={interactiveMotion ? "full" : "reduced"}>
      <section className="home-hero home-container" ref={hero} aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="home-eyebrow"><Leaf size={16} aria-hidden="true" />{copy.eyebrow}</p>
          <h1 id="home-title">{copy.title}<span>{copy.titleAccent}</span></h1>
          <p className="hero-intro">{copy.intro}</p>
          <div className="home-actions">
            <button className="home-button home-button-primary" onClick={onIdentify}>
              <Camera size={20} aria-hidden="true" />{copy.identify}<ArrowRight size={19} aria-hidden="true" />
            </button>
            <button className="home-button home-button-secondary" onClick={onExplore}>
              {copy.explore}<ArrowUpRight size={19} aria-hidden="true" />
            </button>
          </div>
          <p className="hero-hint">{copy.uploadHint}</p>
          <a className="hero-scroll" href="#how-it-works">
            <span><ArrowDown size={17} aria-hidden="true" /></span>{copy.processEyebrow}
          </a>
        </div>

        <div className="hero-visual">
          <div className="hero-orbit" aria-hidden="true" />
          <motion.div
            className="hero-photo-frame"
            style={interactiveMotion ? { y: imageY, rotateX: imageRotate } : { transform: "none" }}
          >
            <img className="hero-photo" src="/breeds/Nari.jpg" alt={copy.heroAlt} width="544" height="365" fetchpriority="high" />
            <div className="hero-photo-shade" aria-hidden="true" />
            <span className="hero-collection-label"><Leaf size={15} aria-hidden="true" />{copy.fieldNote}</span>
            <div className="hero-photo-caption">
              <span><MapPin size={15} aria-hidden="true" />{copy.heroRegion}</span>
              <strong>{copy.heroBreed}</strong>
              <p>{copy.heroTrait}</p>
            </div>
          </motion.div>
          <motion.div className="hero-note-layer" style={interactiveMotion ? { y: noteY } : { transform: "none" }}>
            <GlassCard className="hero-note" interactiveMotion={interactiveMotion}>
              <span className="hero-note-icon"><ScanLine size={25} aria-hidden="true" /></span>
              <div><span className="hero-note-label">{copy.photoLabel}</span>
                <button className="home-text-link" onClick={() => onBreed("Nari")}>
                  {copy.meetBreed}<ArrowUpRight size={18} aria-hidden="true" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
          <span className="hero-edition" aria-hidden="true">01 / 50</span>
        </div>
      </section>

      <div className="home-container">
        <div className="home-facts">
          <div><span className="home-fact-value">50<span className="fact-dot" /></span><span>{copy.supported}</span></div>
          <div><Globe size={26} aria-hidden="true" /><span><strong>English · हिंदी · ગુજરાતી</strong>{copy.languages}</span></div>
          <div><FileDown size={27} aria-hidden="true" /><span><strong>{copy.reportFormat}</strong>{copy.report}</span></div>
        </div>
      </div>

      <section id="how-it-works" className="home-section home-container" aria-labelledby="process-title">
        <div className="home-section-heading">
          <p className="home-eyebrow">{copy.processEyebrow}</p>
          <h2 id="process-title">{copy.processTitle}</h2>
        </div>
        <div className="home-steps">
          {copy.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <GlassCard key={index} className="home-step" interactiveMotion={interactiveMotion}>
                <div className="home-step-top"><Icon size={24} aria-hidden="true" /><span>0{index + 1}</span></div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      <section className="home-collection" aria-labelledby="collection-title">
        <div className="home-container home-section">
          <div className="collection-heading">
            <div className="home-section-heading">
              <p className="home-eyebrow">{copy.collectionEyebrow}</p>
              <h2 id="collection-title">{copy.collectionTitle}</h2>
              <p>{copy.collectionIntro}</p>
            </div>
            <button className="home-button home-button-outline" onClick={onExplore}>
              {copy.allBreeds}<ArrowUpRight size={19} aria-hidden="true" />
            </button>
          </div>
          <div className="home-breeds">
            {featuredBreeds.map((breed) => (
              <GlassCard key={breed.id} className="home-breed" interactiveMotion={interactiveMotion}>
                <button className="home-breed-button" aria-label={`${copy.viewProfile}: ${copy.breedNames[breed.id]}`} onClick={() => onBreed(breed.id)}>
                  <div className={`home-breed-photo ${breed.portrait ? "reference-photo" : ""}`}>
                    <img src={breed.image} alt={copy.breedNames[breed.id]} loading="lazy" width="598" height="398" />
                    <span className="home-breed-arrow"><ArrowUpRight size={23} aria-hidden="true" /></span>
                  </div>
                  <div className="home-breed-content">
                    <span className="home-region"><MapPin size={13} aria-hidden="true" />{copy.breedRegions[breed.id]}</span>
                    <h3>{copy.breedNames[breed.id]}</h3>
                    <p>{copy.breedNotes[breed.id]}</p>
                    <span className="home-profile-link">{copy.viewProfile}<ArrowRight size={16} aria-hidden="true" /></span>
                  </div>
                </button>
              </GlassCard>
            ))}
          </div>
          <div className="home-diversity">
            <Leaf size={27} aria-hidden="true" />
            <div><h3>{copy.diversity}</h3><p>{copy.diversityBody}</p></div>
            <a href="https://www.fao.org/animal-genetics/en/" target="_blank" rel="noreferrer">
              {copy.diversityLink}<ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="home-section home-container home-guide" aria-labelledby="guide-title">
        <div className="home-tips">
          <p className="home-eyebrow">{copy.guideEyebrow}</p>
          <h2 id="guide-title">{copy.guideTitle}</h2>
          <ul>
            {copy.tips.map((tip, index) => {
              const Icon = tipIcons[index];
              return <li key={index}><span className="home-tip-icon"><Icon size={20} aria-hidden="true" /></span><div><h3>{tip.title}</h3><p>{tip.body}</p></div></li>;
            })}
          </ul>
        </div>
        <div className="home-faq">
          <p className="home-eyebrow">{copy.faqEyebrow}</p>
          <h2>{copy.faqTitle}</h2>
          {copy.faqs.map((faq, index) => (
            <details key={index} className="home-faq-item">
              <summary>{faq.question}<ChevronDown size={19} aria-hidden="true" /></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="home-container">
        <section className="home-closing" aria-labelledby="closing-title">
          <div><p className="home-eyebrow"><Leaf size={16} aria-hidden="true" />{copy.closingEyebrow}</p><h2 id="closing-title">{copy.closingTitle}</h2></div>
          <button className="home-button home-button-primary" onClick={onIdentify}>
            <Camera size={20} aria-hidden="true" />{copy.identify}<ArrowRight size={19} aria-hidden="true" />
          </button>
        </section>
      </div>
    </div>
  );
}
