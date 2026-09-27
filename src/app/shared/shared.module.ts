import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonInput, IonIcon, IonItem, IonLabel, IonButton, IonAvatar, IonChip } from '@ionic/angular';

import { AppInputComponent } from './components/app-input.component';
import { AppButtonPrimaryComponent } from './components/app-button-primary.component';
import { AppButtonIconComponent } from './components/app-button-icon.component';
import { AppAvatarComponent } from './components/app-avatar.component';
import { AppChipComponent } from './components/app-chip.component';
import { HarvestPickerCardComponent } from './components/harvest-picker-card.component';

import { KilosPipe } from './pipes/kilos.pipe';
import { CurrencyPipe } from './pipes/currency.pipe';
import { DateFormatPipe } from './pipes/date.pipe';

/**
 * SharedModule - Agrupa componentes, pipes y directivas compartidos.
 * Los componentes NO son standalone (standalone: false) para poder declararlos en este módulo.
 */
@NgModule({
  declarations: [
    AppInputComponent,
    AppButtonPrimaryComponent,
    AppButtonIconComponent,
    AppAvatarComponent,
    AppChipComponent,
    HarvestPickerCardComponent,
    KilosPipe,
    CurrencyPipe,
    DateFormatPipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonInput,
    IonIcon,
    IonItem,
    IonLabel,
    IonButton,
    IonAvatar,
    IonChip,
  ],
  exports: [
    AppInputComponent,
    AppButtonPrimaryComponent,
    AppButtonIconComponent,
    AppAvatarComponent,
    AppChipComponent,
    HarvestPickerCardComponent,
    KilosPipe,
    CurrencyPipe,
    DateFormatPipe,
  ],
})
export class SharedModule {}