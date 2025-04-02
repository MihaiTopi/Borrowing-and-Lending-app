import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Listing } from '../models/listing.model';

@Component({
  selector: 'app-create-listings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-listings.component.html',
  styleUrls: ['./create-listings.component.css']
})
export class CreateListingsComponent {
  newListing: Listing = {
    id: '',
    title: '',
    category: 'Home', // Default category
    price: 0,
    description: '',
    owner: 'me',
    uploadDate: '', // Initialize with an empty string
    location: 'Cluj' // Initialize with an empty string
  };

  categories = ['Home', 'Garden', 'Education', 'Vehicles', 'Technology', 'Computers', 'Clothing'];

  counties = [
    'Alba', 'Arad', 'Arges', 'Bacau', 'Bihor', 'Bistrita-Nasaud', 'Botosani', 'Brasov', 'Braila', 'Buzau', 'Caras-Severin', 'Cluj', 'Constanta', 'Covasna', 'Dambovita', 
    'Dolj', 'Galati', 'Gorj', 'Harghita', 'Hunedoara', 'Ialomita', 'Iasi', 'Ilfov', 'Maramures', 'Mehedinti', 'Mures', 'Neamt', 'Olt', 'Prahova', 'Satu Mare', 'Salaj', 
    'Sibiu', 'Suceava', 'Teleorman', 'Timis', 'Tulcea', 'Valcea', 'Vaslui', 'Vrancea'
  ];

  saveListing() {
    this.newListing.id = crypto.randomUUID(); // Generate unique ID
    this.newListing.uploadDate = new Date().toISOString().split('T')[0]; // Set uploadDate to current date

    const storedListings = localStorage.getItem('listings');
    const listings: Listing[] = storedListings ? JSON.parse(storedListings) : [];
    listings.push(this.newListing);

    localStorage.setItem('listings', JSON.stringify(listings));
    alert('Listing saved!');

    // Reset form
    this.newListing = { 
      id: '', title: '', category: 'Home', price: 0, description: '', owner: 'me', 
      uploadDate: '', location: 'Cluj' 
    };
  }
}
