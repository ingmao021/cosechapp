import { Component, computed, input, numberAttribute } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';

/**
 * Átomo: esqueleto de lista mientras llega la primera carga. Imita la tarjeta de lista
 * (avatar opcional + dos líneas) para que el contenido real aparezca en su sitio, sin el
 * salto de un spinner centrado a una lista.
 */
@Component({
  selector: 'app-list-skeleton',
  standalone: true,
  imports: [IonSkeletonText],
  template: `
    <div class="skeleton-list" role="status" aria-label="Cargando">
      @for (row of rowList(); track row) {
        <div class="skeleton-row">
          @if (avatar()) {
            <ion-skeleton-text [animated]="true" class="skeleton-avatar"></ion-skeleton-text>
          }
          <div class="skeleton-lines">
            <ion-skeleton-text [animated]="true" [style.width.%]="row % 2 ? 48 : 62"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" [style.width.%]="row % 2 ? 34 : 40"></ion-skeleton-text>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .skeleton-list {
      display: flex;
      flex-direction: column;
      gap: var(--card-gap-vertical);
    }
    .skeleton-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      min-height: var(--picker-card-min-height);
      padding: var(--picker-card-padding);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
    }
    ion-skeleton-text {
      --background: rgba(29, 33, 27, 0.07);
      --background-rgb: 29, 33, 27;
      margin: 0;
      border-radius: var(--radius-sm);
    }
    .skeleton-avatar {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    .skeleton-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    .skeleton-lines ion-skeleton-text {
      height: 12px;
    }
    .skeleton-lines ion-skeleton-text:first-child {
      height: 14px;
    }
  `],
})
export class ListSkeletonComponent {
  rows = input(4, { transform: numberAttribute });
  avatar = input(true);

  protected readonly rowList = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
}
