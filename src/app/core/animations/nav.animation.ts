import { Animation, AnimationBuilder, createAnimation } from '@ionic/angular';

/** Mismas curvas que `--ease-out` en variables.css (WAAPI no lee variables CSS). */
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const ENTER_MS = 240;
const LEAVE_MS = 180;
const OFFSET = '12px';

interface NavTransitionOptions {
  enteringEl: HTMLElement;
  leavingEl?: HTMLElement;
  direction?: 'forward' | 'back' | 'root';
}

/** El elemento `.ion-page` que se anima (Ionic lo envuelve a veces en otro nodo). */
function pageOf(el: HTMLElement): HTMLElement {
  if (el.classList.contains('ion-page')) return el;
  return el.querySelector<HTMLElement>(':scope > .ion-page, :scope > ion-nav, :scope > ion-tabs') ?? el;
}

/**
 * Transición entre páginas (Design System §2.8). Reemplaza la de Ionic md, cuyo "volver"
 * usa ease-in y 40px de recorrido: aquí la página nueva sube 12px y aparece con ease-out,
 * y al volver la que se va baja y se desvanece más rápido de lo que entró.
 * Con movimiento reducido solo queda el fundido.
 */
export const navAnimation: AnimationBuilder = (_baseEl: unknown, opts: NavTransitionOptions): Animation => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const offset = reduceMotion ? '0px' : OFFSET;
  const back = opts.direction === 'back';

  const root = createAnimation()
    .addElement(pageOf(opts.enteringEl))
    .fill('both')
    .beforeRemoveClass('ion-page-invisible')
    .easing(EASE_OUT);

  if (!back) {
    return root
      .duration(ENTER_MS)
      .fromTo('transform', `translateY(${offset})`, 'translateY(0px)')
      .fromTo('opacity', 0.01, 1);
  }

  root.duration(LEAVE_MS);
  if (opts.leavingEl) {
    const leaving = createAnimation()
      .addElement(pageOf(opts.leavingEl))
      .onFinish((step) => {
        if (step === 1 && leaving.elements.length > 0) leaving.elements[0].style.setProperty('display', 'none');
      })
      .fromTo('transform', 'translateY(0px)', `translateY(${offset})`)
      .fromTo('opacity', 1, 0);
    root.addAnimation(leaving);
  }
  return root;
};
