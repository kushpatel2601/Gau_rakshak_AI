import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform } from "framer-motion";
import {
  ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Camera, Check,
  ChevronDown, FileDown, Focus, Globe, Leaf, MapPin, ScanLine, Sun,
} from "lucide-react";
import { featuredBreeds, homeContent, homeParts } from "../homeContent";
import HeroSlideshow from "./HeroSlideshow";
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
  const [activePart, setActivePart] = useState(homeParts[0]);
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

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const current = entries.find((entry) => entry.isIntersecting);
      if (current) setActivePart(current.target.id);
    }, { rootMargin: "-25% 0px -60% 0px" });
    homeParts.forEach((id) => observer.observe(document.getElementById(id)));
    return () => observer.disconnect();
  }, []);

  const scrollToPart = (event, id) => {
    event.preventDefault();
    const section = document.getElementById(id);
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="homepage" data-motion={interactiveMotion ? "full" : "reduced"}>
      <nav className="home-parts-nav" aria-label={copy.sectionNavigation}>
        {homeParts.map((id, index) => (
          <a key={id} href={`#${id}`} onClick={(event) => scrollToPart(event, id)} aria-current={activePart === id ? "step" : undefined}>
            <span className="home-part-number" aria-hidden="true">0{index + 1}</span>
            <span className="home-part-name">{copy.sections[index]}</span>
          </a>
        ))}
      </nav>
      <section id="home-intro" className="home-part" tabIndex={-1} aria-labelledby="home-title">
      <div className="home-hero home-container" ref={hero}>
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
          <a className="hero-scroll" href="#how-it-works" onClick={(event) => scrollToPart(event, "how-it-works")}>
            <span><ArrowDown size={17} aria-hidden="true" /></span>{copy.processEyebrow}
          </a>
        </div>

        <HeroSlideshow
          copy={copy}
          lang={lang}
          reduceMotion={reduceMotion}
          onBreed={onBreed}
          imageStyle={interactiveMotion ? { y: imageY, rotateX: imageRotate } : { transform: "none" }}
          noteStyle={interactiveMotion ? { y: noteY } : { transform: "none" }}
        />
      </div>

      <div className="home-container">
        <div className="home-facts">
          <div><span className="home-fact-value">50<span className="fact-dot" /></span><span>{copy.supported}</span></div>
          <div><Globe size={26} aria-hidden="true" /><span><strong>English · हिंदी · ગુજરાતી</strong>{copy.languages}</span></div>
          <div><FileDown size={27} aria-hidden="true" /><span><strong>{copy.reportFormat}</strong>{copy.report}</span></div>
        </div>
      </div>
      </section>

      <section id="how-it-works" className="home-part home-part-process home-section home-container" tabIndex={-1} aria-labelledby="process-title">
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

      <section id="breed-collection" className="home-part home-collection" tabIndex={-1} aria-labelledby="collection-title">
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

      <section id="photo-guide" className="home-part" tabIndex={-1} aria-labelledby="guide-title">
      <div className="home-section home-container home-guide">
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
      </div>

      <div className="home-container home-closing-container">
        <div className="home-closing">
          <div><p className="home-eyebrow"><Leaf size={16} aria-hidden="true" />{copy.closingEyebrow}</p><h2 id="closing-title">{copy.closingTitle}</h2></div>
          <button className="home-button home-button-primary" onClick={onIdentify}>
            <Camera size={20} aria-hidden="true" />{copy.identify}<ArrowRight size={19} aria-hidden="true" />
          </button>
        </div>
      </div>
      </section>
    </div>
  );
}
