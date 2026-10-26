import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NavRowComponent } from './nav-row.component';

@Component({
  standalone: true,
  imports: [NavRowComponent],
  template: `
    <button app-nav-row icon="people-outline" label="Catálogo de trabajadores" [subtitle]="subtitle()" (click)="clicks = clicks + 1">
      <span nav-row-end class="end">12</span>
    </button>
    <button app-nav-row initials="JP" label="Juan Pérez" [chevron]="false"></button>
  `,
})
class HostComponent {
  subtitle = signal('');
  clicks = 0;
}

describe('NavRowComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const rows = () => fixture.debugElement.queryAll(By.css('button[app-nav-row]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('is the button itself, so its text is its accessible name', () => {
    const row = rows()[0].nativeElement as HTMLButtonElement;
    expect(row.type).toBe('button');
    expect(row.textContent).toContain('Catálogo de trabajadores');
    expect(row.classList).toContain('tappable');
  });

  it('shows the subtitle only when given, and projects the end slot', () => {
    expect(rows()[0].query(By.css('.nav-row__subtitle'))).toBeNull();
    fixture.componentInstance.subtitle.set('8 activos');
    fixture.detectChanges();
    expect(rows()[0].query(By.css('.nav-row__subtitle')).nativeElement.textContent).toBe('8 activos');
    expect(rows()[0].query(By.css('.end')).nativeElement.textContent).toBe('12');
  });

  it('uses initials instead of the icon and can hide the chevron', () => {
    expect(rows()[1].query(By.css('.nav-row__initials')).nativeElement.textContent).toBe('JP');
    expect(rows()[1].query(By.css('.nav-row__chevron'))).toBeNull();
    expect(rows()[0].query(By.css('.nav-row__chevron'))).toBeTruthy();
  });

  it('forwards clicks to the page', () => {
    (rows()[0].nativeElement as HTMLButtonElement).click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });
});
