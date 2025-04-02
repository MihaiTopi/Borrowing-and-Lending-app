import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Listing } from '../models/listing.model';
import { FormsModule } from '@angular/forms'; // Make sure you import FormsModule for ngModel

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [CommonModule, FormsModule], // Import FormsModule for two-way binding
  templateUrl: './my-listings.component.html',
  styleUrls: ['./my-listings.component.css']
})
export class MyListingsComponent implements OnInit {
  myListings: Listing[] = [];
  isEditing = false; // Flag to track if the edit form is shown
  editingListing: Listing | null = null; // The listing currently being edited

  ngOnInit() {
    const storedListings = localStorage.getItem('listings');
    const allListings: Listing[] = storedListings ? JSON.parse(storedListings) : [];

    this.myListings = allListings.filter(listing => listing.owner === 'me');
  }

  deleteListing(id: string) {
    this.myListings = this.myListings.filter(listing => listing.id !== id);

    const storedListings = localStorage.getItem('listings');
    let allListings: Listing[] = storedListings ? JSON.parse(storedListings) : [];
    allListings = allListings.filter(listing => listing.id !== id);

    localStorage.setItem('listings', JSON.stringify(allListings));
  }

  editListing(listing: Listing) {
    this.isEditing = true;
    this.editingListing = { ...listing }; // Create a copy of the listing to edit
  }

  cancelEdit() {
    // Cancel the edit process
    this.isEditing = false;
    this.editingListing = null;
  }

  submitEdit() {
    if (this.editingListing) {
      // Update the listing in the local storage and myListings
      const index = this.myListings.findIndex(listing => listing.id === this.editingListing!.id);
      if (index !== -1) {
        this.myListings[index] = { ...this.editingListing }; // Update the local listing array
      }

      // Update the listing in the full list stored in localStorage
      const storedListings = localStorage.getItem('listings');
      let allListings: Listing[] = storedListings ? JSON.parse(storedListings) : [];
      const allListingsIndex = allListings.findIndex(listing => listing.id === this.editingListing!.id);
      if (allListingsIndex !== -1) {
        allListings[allListingsIndex] = { ...this.editingListing }; // Update the global localStorage array
        localStorage.setItem('listings', JSON.stringify(allListings));
      }

      // Close the edit form
      this.isEditing = false;
      this.editingListing = null;
    }
  }
}
