import { Component, inject, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ToastController } from '@ionic/angular/toast-controller';
import { addIcons } from 'ionicons';
import { arrowBack, flash, flashOff } from 'ionicons/icons';
import { NetworkService } from '../../network/services/network.service';

/**
 * Barra superior de Login y Registro: "volver" a la izquierda y, a la derecha, el estado
 * de la conexión (rayo = con señal, rayo tachado = sin señal). El estado no depende solo
 * del color: cambia el ícono y el nombre accesible, y al tocarlo se explica qué implica.
 */
@Component({
  selector: 'app-auth-top-bar',
  standalone: true,
  imports: [IonIcon],
  template: `
    <div class="top-bar">
      <button type="button" class="circle-btn" [attr.aria-label]="backLabel()" (click)="back.emit()">
        <ion-icon name="arrow-back" aria-hidden="true"></ion-icon>
      </button>
      <button
        type="button"
        class="circle-btn connection"
        [class.is-offline]="network.isOffline()"
        [attr.aria-label]="network.isOnline() ? 'Con conexión' : 'Sin conexión'"
        (click)="explainConnection()"
      >
        <ion-icon [name]="network.isOnline() ? 'flash' : 'flash-off'" aria-hidden="true"></ion-icon>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    /* Con señal: círculo verde oscuro y rayo blanco (5.9:1). Sin señal: círculo blanco
       y rayo tachado en rojo tierra, para que se note sin leer nada. */
    .connection {
      background: var(--color-primary-ink);
      color: #FFFFFF;
      transition:
        transform var(--dur-release) var(--ease-out),
        background-color var(--dur-base) var(--ease-out),
        color var(--dur-base) var(--ease-out);
    }
    .connection.is-offline {
      background: var(--color-surface);
      color: var(--color-accent-alert);
    }
  `],
})
export class AuthTopBarComponent {
  protected readonly network = inject(NetworkService);
  private readonly toastController = inject(ToastController);

  backLabel = input('Volver');
  back = output<void>();

  constructor() {
    addIcons({ arrowBack, flash, flashOff });
  }

  async explainConnection(): Promise<void> {
    const toast = await this.toastController.create({
      message: this.network.isOnline()
        ? 'Tienes conexión: puedes ingresar o crear tu cuenta.'
        : 'Sin conexión. Para ingresar la primera vez necesitas señal; después la app funciona sin ella.',
      duration: 3000,
      position: 'top',
    });
    await toast.present();
  }
}
