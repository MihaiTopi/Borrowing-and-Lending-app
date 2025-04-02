import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // ✅ Import this for <router-outlet>

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule], // ✅ Add RouterModule here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Borrow and Lend Platform';
}
