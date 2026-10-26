import { Component, computed, input, output } from '@angular/core';

export interface SegmentedOption {
  value: string;
  label: string;
}

/**
 * Átomo: control segmentado estilo sistema (Design System §2.6). Riel gris en píldora
 * con una "pastilla" blanca que se desliza hasta la opción elegida.
 * Es controlado: la página decide el valor (así una opción puede abrir algo antes de
 * quedar elegida, como "Otro día" con el calendario).
 * Uso:
 *   <app-segmented [options]="dias" [value]="dia()" (selected)="elegir($event)" ariaLabel="Fecha de la venta" />
 */
@Component({
  selector: 'app-segmented',
  standalone: true,
  template: `
    <div
      class="seg"
      role="radiogroup"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="labelledBy() || null"
      [style.--seg-count]="options().length"
      (keydown)="onKeydown($event)"
    >
      <span
        class="seg__thumb"
        [class.is-hidden]="selectedIndex() < 0"
        [style.transform]="'translateX(' + (selectedIndex() < 0 ? 0 : selectedIndex()) * 100 + '%)'"
        aria-hidden="true"
      ></span>
      @for (option of options(); track option.value; let i = $index) {
        <button
          type="button"
          role="radio"
          class="seg__option"
          [class.is-selected]="i === selectedIndex()"
          [attr.aria-checked]="i === selectedIndex()"
          [attr.tabindex]="i === focusIndex() ? 0 : -1"
          (click)="selected.emit(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .seg {
      position: relative;
      display: grid;
      grid-template-columns: repeat(var(--seg-count), 1fr);
      padding: 4px;
      border-radius: var(--radius-full);
      background: rgba(29, 33, 27, 0.06);
    }
    /* La pastilla mide una columna y se desplaza de a una: un solo elemento que se
       mueve, no N fondos que se encienden y apagan. */
    .seg__thumb {
      position: absolute;
      top: 4px;
      bottom: 4px;
      left: 4px;
      width: calc((100% - 8px) / var(--seg-count));
      border-radius: var(--radius-full);
      background: var(--color-surface);
      box-shadow: 0 1px 2px rgba(29, 33, 27, 0.08), 0 4px 12px rgba(29, 33, 27, 0.08);
      transition:
        transform var(--dur-base) var(--ease-in-out),
        opacity var(--dur-fast) var(--ease-out);
    }
    .seg__thumb.is-hidden {
      opacity: 0;
    }
    .seg__option {
      position: relative;
      min-height: 44px;
      min-width: 0;
      padding: 0 var(--spacing-sm);
      border: 0;
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--color-text-muted);
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition:
        color var(--dur-fast) var(--ease-out),
        transform var(--dur-release) var(--ease-out);
    }
    .seg__option.is-selected {
      color: var(--color-text);
      font-weight: var(--font-weight-semibold);
    }
    .seg__option:active {
      transform: scale(0.96);
      transition-duration: var(--dur-press);
    }
    @media (prefers-reduced-motion: reduce) {
      .seg__thumb {
        transition: opacity var(--dur-fast) var(--ease-out);
      }
      .seg__option:active {
        transform: none;
      }
    }
  `],
})
export class SegmentedComponent {
  options = input.required<SegmentedOption[]>();
  value = input<string | null>(null);
  ariaLabel = input<string>('');
  labelledBy = input<string>('');

  /** El valor tocado (también si ya estaba elegido: la página decide qué hacer). */
  selected = output<string>();

  readonly selectedIndex = computed(() => this.options().findIndex((o) => o.value === this.value()));
  /** Con nada elegido, la primera opción recibe el foco del teclado (patrón radiogroup). */
  readonly focusIndex = computed(() => Math.max(0, this.selectedIndex()));

  /** Flechas: mueven la elección a la opción vecina, como un grupo de radios nativo. */
  onKeydown(event: KeyboardEvent): void {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const options = this.options();
    const next = (this.focusIndex() + step + options.length) % options.length;
    this.selected.emit(options[next].value);
    const buttons = (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('.seg__option');
    buttons[next]?.focus();
  }
}
