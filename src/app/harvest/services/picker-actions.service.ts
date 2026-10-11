import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActionSheetController } from '@ionic/angular/action-sheet-controller';
import { AlertController } from '@ionic/angular/alert-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { HarvestFacade } from './harvest.facade';
import { PickerStatsResponse } from './harvest.service';
import { WorkerFacade } from '../../worker/services/worker.facade';
import { apiErrorMessage } from '../../shared/utils';
import { addIcons } from 'ionicons';
import { createOutline, swapHorizontalOutline, trashOutline } from 'ionicons/icons';

/**
 * Menú ⋮ de un recolector de la cosecha (en una cuadrilla o sin cuadrilla):
 * editar su nombre, cambiarlo de cuadrilla o quitarlo de la cosecha.
 */
@Injectable({ providedIn: 'root' })
export class PickerActionsService {
  private readonly harvestFacade = inject(HarvestFacade);
  private readonly workerFacade = inject(WorkerFacade);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  constructor() {
    addIcons({ createOutline, swapHorizontalOutline, trashOutline });
  }

  async openMenu(picker: PickerStatsResponse): Promise<void> {
    const sheet = await this.actionSheetController.create({
      header: picker.displayName,
      buttons: [
        { text: 'Editar nombre', icon: 'create-outline', handler: () => void this.editName(picker) },
        { text: 'Cambiar de cuadrilla', icon: 'swap-horizontal-outline', handler: () => void this.move(picker) },
        { text: 'Eliminar de la cosecha', icon: 'trash-outline', role: 'destructive', handler: () => void this.remove(picker) },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async editName(picker: PickerStatsResponse): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Editar nombre',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre o alias',
          value: picker.displayName,
          attributes: { maxlength: 50, autocapitalize: 'words' },
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', role: 'confirm', handler: (data: { name: string }) => !!data.name?.trim() },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss<{ values: { name: string } }>();
    const name = data?.values.name?.trim();
    if (role !== 'confirm' || !name || name === picker.displayName) return;

    try {
      // El nombre vive en el catálogo; se conserva el teléfono que ya tenía.
      const worker = await this.workerFacade.getWorker(picker.workerId);
      await this.workerFacade.updateWorker(picker.workerId, {
        firstName: name,
        lastName: '',
        phoneNumber: worker?.phoneNumber ?? undefined,
      });
      // Un alias propio de la cosecha taparía el nombre nuevo.
      if (picker.alias && picker.alias !== worker?.alias) await this.harvestFacade.clearPickerAlias(picker.id);
      await this.harvestFacade.loadPickers(picker.harvestId);
      await this.toast('Nombre actualizado.', 'success');
    } catch (err: unknown) {
      await this.toast(apiErrorMessage(err, 'No se pudo cambiar el nombre.'), 'danger');
    }
  }

  private async move(picker: PickerStatsResponse): Promise<void> {
    const crews = this.harvestFacade.activeHarvestCrews();
    const alert = await this.alertController.create({
      header: 'Cambiar de cuadrilla',
      inputs: [
        { type: 'radio', label: 'Sin cuadrilla', value: '', checked: picker.crewId === null },
        ...crews.map((crew) => ({ type: 'radio' as const, label: crew.name, value: crew.id, checked: crew.id === picker.crewId })),
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Mover', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss<{ values: string }>();
    if (role !== 'confirm' || data === undefined) return;
    const crewId = data.values || null;
    if (crewId === picker.crewId) return;

    try {
      await this.harvestFacade.movePicker(picker.id, crewId);
      const where = crewId ? (this.harvestFacade.crewById(crewId)?.name ?? 'la cuadrilla') : 'sin cuadrilla';
      await this.toast(`${picker.displayName} quedó ${crewId ? 'en ' : ''}${where}.`, 'success');
    } catch (err: unknown) {
      await this.toast(apiErrorMessage(err, 'No se pudo cambiar de cuadrilla.'), 'danger');
    }
  }

  private async remove(picker: PickerStatsResponse): Promise<void> {
    if (!(await this.confirm('¿Quitarlo de la cosecha?', `${picker.displayName} sale de esta cosecha. Sigue en tu catálogo de trabajadores.`, 'Quitar'))) {
      return;
    }
    try {
      await this.harvestFacade.deletePicker(picker.id);
      await this.toast(`${picker.displayName} salió de la cosecha.`, 'success');
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse && err.status === 409) {
        this.harvestFacade.clearError();
        await this.offerArchive(picker);
        return;
      }
      await this.toast(apiErrorMessage(err, 'No se pudo quitar el recolector.'), 'danger');
    }
  }

  /** Con pesadas o pagos no se borra (se perderían): se archiva y deja de aparecer para pesar. */
  private async offerArchive(picker: PickerStatsResponse): Promise<void> {
    const archive = await this.confirm(
      'Ya tiene pesadas o pagos',
      `No se puede eliminar a ${picker.displayName} sin perder ese registro. ¿Archivarlo? Deja de aparecer para pesar y se conserva lo registrado.`,
      'Archivar',
    );
    if (!archive) return;
    try {
      await this.harvestFacade.archiveWorker(picker.id);
      await this.toast(`${picker.displayName} quedó archivado.`, 'success');
    } catch (err: unknown) {
      await this.toast(apiErrorMessage(err, 'No se pudo archivar el recolector.'), 'danger');
    }
  }

  private async confirm(header: string, message: string, action: string): Promise<boolean> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: action, role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'destructive';
  }

  private async toast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 3000, position: 'bottom' });
    await toast.present();
  }
}
