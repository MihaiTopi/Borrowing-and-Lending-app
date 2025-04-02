import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';  // Import AppComponent directly
import { RouterTestingModule } from '@angular/router/testing';  // Import RouterTestingModule

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,  // Import the standalone AppComponent here
        RouterTestingModule  // Include RouterTestingModule for routing functionality
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
