import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideRouter } from '@angular/router'; 
import { importProvidersFrom } from '@angular/core'; // ✅ Use this instead
import { FormsModule } from '@angular/forms'; // ✅ Import FormsModule

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // ✅ Correct routing
    importProvidersFrom(FormsModule) // ✅ Alternative for provideForms()
  ]
});
