// Client-only (imported by the lazily loaded GSAP chunks: components/home/gsap-scenes.tsx and
// ./drive-scenes.tsx). The courier campaign's motion, written once for the home section and the
// /drive-with-carrivo page. Every function must run inside a gsap.matchMedia() context that already
// excludes reduced motion, so that unmounting (or a preference change) reverts it all.
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export type Cleanup = () => void;

/** Closest point on the path (0-1) to (x, y), so a loop starts where the server drew the element. */
export function progressAt(path: SVGPathElement, x: number, y: number): number {
  const length = path.getTotalLength();
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i <= 200; i += 1) {
    const point = path.getPointAtLength((length * i) / 200);
    const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i / 200;
    }
  }
  return best;
}

/** Where a server-drawn SVG element sits (its translate). */
export function originOf(element: SVGGraphicsElement): { x: number; y: number } {
  const matrix = element.transform.baseVal.consolidate()?.matrix;
  return { x: matrix?.e ?? 0, y: matrix?.f ?? 0 };
}

/** The courier rides `path` on a loop from where it was drawn, leaning with the road. */
function ride(rider: SVGGElement, path: SVGPathElement, duration: number): gsap.core.Tween {
  const { x, y } = originOf(rider);
  return gsap
    .to(rider, { motionPath: { path, align: path, alignOrigin: [0.55, 1], autoRotate: true }, duration, ease: "none", repeat: -1 })
    .progress(progressAt(path, x, y));
}

/**
 * Runs `tweens` (and the CSS route flow, via [data-live]) only while `root` is on screen.
 * Off screen everything pauses, so a band nobody sees costs nothing.
 */
function liveWhileVisible(root: HTMLElement, tweens: gsap.core.Animation[]): Cleanup {
  for (const tween of tweens) tween.pause();
  ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      root.toggleAttribute("data-live", self.isActive);
      for (const tween of tweens) {
        if (self.isActive) tween.play();
        else tween.pause();
      }
    },
  });
  return () => root.removeAttribute("data-live");
}

/** Cards bob gently, each on its own beat; deeper cards also drift with the scroll (parallax). */
function floatAndParallax(root: HTMLElement): gsap.core.Animation[] {
  const floats = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-float]")).map((card, i) =>
    gsap.to(card, { y: -8, duration: 2.4 + i * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.3 }),
  );
  for (const layer of gsap.utils.toArray<HTMLElement | SVGElement>(root.querySelectorAll("[data-depth]"))) {
    const depth = Number(layer.getAttribute("data-depth")) || 1;
    // A wrapper property (not y) so it never fights the float tween on the same element.
    gsap.fromTo(layer, { yPercent: 6 * depth }, { yPercent: -6 * depth, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6 } });
  }
  return floats;
}

/** Headline words rise into place once the heading scrolls into view (only if it starts below the fold). */
function revealWords(root: HTMLElement): void {
  const words = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-campaign-word]"));
  if (words.length === 0 || words[0].getBoundingClientRect().top < window.innerHeight) return;
  gsap.from(words, {
    yPercent: 110,
    duration: 1,
    ease: "power4.out",
    stagger: 0.08,
    scrollTrigger: { trigger: words[0], start: "top 85%", once: true },
  });
}

/** Home page: the "Drive with Carrivo" band. */
export function homeCampaign(): Cleanup | undefined {
  const root = document.querySelector<HTMLElement>("[data-campaign]");
  if (!root) return undefined;
  const path = root.querySelector<SVGPathElement>("[data-street-route]");
  const rider = root.querySelector<SVGGElement>("[data-campaign-rider]");
  const tweens: gsap.core.Animation[] = floatAndParallax(root);
  if (path && rider) tweens.push(ride(rider, path, 9));
  revealWords(root);
  return liveWhileVisible(root, tweens);
}

/** /drive-with-carrivo hero: the courier crosses the whole panorama; skyline layers drift at their depth. */
export function panorama(): Cleanup | undefined {
  const root = document.querySelector<HTMLElement>("[data-panorama]");
  if (!root) return undefined;
  const path = root.querySelector<SVGPathElement>("[data-panorama-route]");
  const rider = root.querySelector<SVGGElement>("[data-campaign-rider]");
  const tweens: gsap.core.Animation[] = floatAndParallax(root);
  if (path && rider) tweens.push(ride(rider, path, 16));
  return liveWhileVisible(root, tweens);
}

/** /drive-with-carrivo timeline: the orange rail fills as you read down the steps. */
export function timelineFill(): void {
  const fill = document.querySelector<HTMLElement>("[data-timeline-fill]");
  const list = fill?.parentElement;
  if (!fill || !list) return;
  gsap.fromTo(
    fill,
    { scaleY: 0 },
    { scaleY: 1, ease: "none", scrollTrigger: { trigger: list, start: "top 70%", end: "bottom 60%", scrub: 0.4 } },
  );
}
