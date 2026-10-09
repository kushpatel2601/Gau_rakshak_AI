import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
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

function StackCard({ id, index, layout, scrollY, reduceMotion, children, className = "", ...props }) {
  const progress = useTransform(scrollY, [layout?.start ?? 0, layout?.end ?? 1], [0, 1]);
  const scale = useTransform(progress, [0, 1], [1, 0.94]);
  const rotateX = useTransform(progress, [0, 1], [0, -4]);
  const y = useTransform(progress, [0, 1], [0, -6]);
  const recedes = !reduceMotion && layout && index < homeParts.length - 1;

  return (
    <>
      <div id={`${id}-anchor`} className="home-stack-anchor" aria-hidden="true" />
      <motion.section
        {...props}
        id={id}
        tabIndex={-1}
        className={`home-part home-stack-card ${className}`}
        style={{
          top: layout?.top,
          zIndex: index + 1,
          ...(recedes ? { scale, rotateX, y, transformPerspective: 1400 } : { transform: "none" }),
        }}
      >
        {children}
      </motion.section>
    </>
  );
}

export default function HomePage({ lang, onIdentify, onExplore, onBreed, reduceMotion = true }) {
  const copy = homeContent[lang];
  const [finePointer, setFinePointer] = useState(false);
  const [activePart, setActivePart] = useState(homeParts[0]);
  const [stackLayout, setStackLayout] = useState([]);
  const hero = useRef(null);
  const { scrollY, scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
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
    const cards = homeParts.map((id) => document.getElementById(id));
    const anchors = homeParts.map((id) => document.getElementById(`${id}-anchor`));
    const header = document.querySelector(".site-header");
    let frame;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const headerHeight = header.getBoundingClientRect().height;
        const positions = anchors.map((anchor) => anchor.getBoundingClientRect().top + window.scrollY);
        // Tall cards scroll completely into view before their bottom edge pins.
        const tops = cards.map((card, index) =>
          Math.min(headerHeight + 20 + index * 10, window.innerHeight - card.offsetHeight - 24));
        const next = cards.map((card, index) => ({
          top: tops[index],
          anchor: positions[index],
          navigationTop: Math.max(0, positions[index] - headerHeight - 20),
          activeAt: positions[index] - headerHeight - (window.innerHeight - headerHeight) * 0.35,
          start: (positions[index + 1] ?? positions[index]) - window.innerHeight + 48,
          end: (positions[index + 1] ?? positions[index]) - (tops[index + 1] ?? tops[index]),
        }));
        setStackLayout((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      });
    };
    const observer = new ResizeObserver(measure);
    [...cards, header].forEach((element) => observer.observe(element));
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(frame);
    };
  }, [lang, reduceMotion]);

  useMotionValueEvent(scrollY, "change", (value) => {
    const active = stackLayout.reduce((current, layout, index) => value >= layout.activeAt ? index : current, 0);
    setActivePart(homeParts[active]);
  });

  const scrollToPart = (event, id) => {
    event.preventDefault();
    const section = document.getElementById(id);
    section.focus({ preventScroll: true });
    const layout = stackLayout[homeParts.indexOf(id)];
    window.scrollTo({
      top: layout?.navigationTop ?? document.getElementById(`${id}-anchor`).getBoundingClientRect().top + window.scrollY,
      behavior: reduceMotion ? "auto" : "smooth",
    });
    setActivePart(id);
  };

  const revealFocusedCard = (event, id) => {
    if (event.target === event.currentTarget || activePart === id) return;
    const layout = stackLayout[homeParts.indexOf(id)];
    if (layout) window.scrollTo({ top: layout.navigationTop, behavior: "auto" });
    setActivePart(id);
  };

  return (
    <div className="homepage" data-motion={interactiveMotion ? "full" : "reduced"} data-reduced-motion={reduceMotion}>
      <nav className="home-parts-nav" aria-label={copy.sectionNavigation}>
        {homeParts.map((id, index) => (
          <a key={id} href={`#${id}`} onClick={(event) => scrollToPart(event, id)} aria-current={activePart === id ? "step" : undefined}>
            <span className="home-part-number" aria-hidden="true">0{index + 1}</span>
            <span className="home-part-name">{copy.sections[index]}</span>
          </a>
        ))}
      </nav>
      <StackCard id="home-intro" index={0} layout={stackLayout[0]} scrollY={scrollY} reduceMotion={reduceMotion} aria-labelledby="home-title" onFocusCapture={(event) => revealFocusedCard(event, "home-intro")}>
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
          active={activePart === homeParts[0]}
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
      </StackCard>

      <StackCard id="how-it-works" index={1} layout={stackLayout[1]} scrollY={scrollY} reduceMotion={reduceMotion} className="home-part-process home-section home-container" aria-labelledby="process-title" onFocusCapture={(event) => revealFocusedCard(event, "how-it-works")}>
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
      </StackCard>

      <StackCard id="breed-collection" index={2} layout={stackLayout[2]} scrollY={scrollY} reduceMotion={reduceMotion} className="home-collection" aria-labelledby="collection-title" onFocusCapture={(event) => revealFocusedCard(event, "breed-collection")}>
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
      </StackCard>

      <StackCard id="photo-guide" index={3} layout={stackLayout[3]} scrollY={scrollY} reduceMotion={reduceMotion} aria-labelledby="guide-title" onFocusCapture={(event) => revealFocusedCard(event, "photo-guide")}>
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
      </StackCard>
    </div>
  );
}
