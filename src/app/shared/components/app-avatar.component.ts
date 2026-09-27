import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonAvatar } from '@ionic/angular/ion-avatar';
import { IonIcon } from '@ionic/angular/ion-icon';

/**
 * Componente atómico: Avatar / Foto de perfil
 * Espec Design System: 64dp (o tamaño custom), radius 50%
 * Uso: <app-avatar [src]="photoUrl" [fallbackIcon]="'person-outline'" (click)="onPickPhoto()" />
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule, IonAvatar, IonIcon],
  template: `
    <ion-avatar
      [class.clickable]="clickable()"
      (click)="onClick($event)"
    >
      @if (src()) {
        <img [src]="src()" [alt]="alt()" />
      } @else {
        <ion-icon [name]="fallbackIcon()" size="large"></ion-icon>
      }
    </ion-avatar>
  `,
  styles: [`
    ion-avatar {
      width: var(--avatar-size);
      height: var(--avatar-size);
      --border-radius: var(--avatar-radius);
      background: var(--color-primary);
      color: var(--color-text-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    ion-avatar img {
      width: 100%;
      height: 100%;
      border-radius: var(--avatar-radius);
      object-fit: cover;
    }
    ion-avatar.clickable {
      cursor: pointer;
      border: 2dp solid var(--color-border);
      transition: border-color 0.2s ease;
    }
    ion-avatar.clickable:hover,
    ion-avatar.clickable:active {
      border-color: var(--color-primary);
    }
    ion-icon {
      font-size: 32dp;
    }
  `],
})
export class AppAvatarComponent {
  src = input<string | null>(null);
  alt = input<string>('Foto de perfil');
  fallbackIcon = input<string>('person-outline');
  clickable = input<boolean>(false);

  click = output<Event>();

  onClick(event: Event): void {
    if (this.clickable()) {
      this.click.emit(event);
    }
  }
}