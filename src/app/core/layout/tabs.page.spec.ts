import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { TabsPage } from './tabs.page';

describe('TabsPage', () => {
  let fixture: ComponentFixture<TabsPage>;
  let router: Router;

  const createButton = () => fixture.debugElement.query(By.css('.tabs-create'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsPage],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(TabsPage);
    fixture.detectChanges();
  });

  it('shows four tabs with single-word labels and the Crear button', () => {
    const labels = fixture.debugElement.queryAll(By.css('ion-tab-button ion-label')).map((l) => l.nativeElement.textContent.trim());
    expect(labels).toEqual(['Inicio', 'Mercado', 'Historial', 'Perfil']);
    expect(createButton().attributes['aria-label']).toBe('Crear');
  });

  it('opens the Crear section, which decides between the form and the open harvest', async () => {
    createButton().triggerEventHandler('click', {});
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/create']);
  });

  it('announces Crear as the current page only while it is selected', () => {
    expect(createButton().attributes['aria-current']).toBeUndefined();

    (fixture.componentInstance as unknown as { selected: { set(tab: string): void } }).selected.set('create');
    fixture.detectChanges();

    expect(createButton().attributes['aria-current']).toBe('page');
  });
});
