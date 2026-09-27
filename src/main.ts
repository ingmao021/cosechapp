import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { SyncFacade } from '@sync/services/sync.facade';
import { NetworkService } from '@network/services/network.service';
import { PushNotificationService } from '@network/services/push-notification.service';
import { PriceAndNewsFacade } from '@price-and-news/services/price-and-news.facade';

bootstrapApplication(AppComponent, appConfig)
  .then((appRef) => {
    // Inicializar servicios críticos al arrancar
    const injector = appRef.injector;

    // Inicializar sincronización offline
    const syncFacade = injector.get(SyncFacade);
    syncFacade.initialize();

    // Inicializar servicios de red y push
    injector.get(NetworkService);
    injector.get(PushNotificationService);

    // Inicializar precio y noticias
    const priceFacade = injector.get(PriceAndNewsFacade);
    priceFacade.loadAll();
  })
  .catch((err: unknown) => console.log(err));