import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { Listing } from '../models/listing.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private apiUrl = 'http://26.183.81.226:3000';
  //private apiUrl = 'http://localhost:3000/listings';

  private mockListings: Listing[] = [
    { id: uuidv4(), title: 'Electric Scooter', category: 'Vehicles', price: 25, description: 'Fast and efficient electric scooter.', owner: 'user6', uploadDate: '2025-03-25', location: 'Ilfov' },
    { id: uuidv4(), title: 'Camping Tent', category: 'Home', price: 10, description: 'Spacious tent for outdoor adventures.', owner: 'user7', uploadDate: '2025-03-26', location: 'Brasov' },
    { id: uuidv4(), title: 'VR Headset', category: 'Technology', price: 30, description: 'High-end virtual reality headset.', owner: 'user8', uploadDate: '2025-03-27', location: 'Sibiu' },
  ];

  constructor(private http: HttpClient) {}

  getListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(this.apiUrl).pipe(
      catchError(() => {
        return of(this.mockListings);
      })
    );
  }

  addListing(listing: Listing): Observable<Listing> {
    // if no ID provided, generate one
    if (!listing.id) {
      listing.id = uuidv4();
    }

    return this.http.post<Listing>(this.apiUrl, listing).pipe(
      catchError(() => {
        this.mockListings.push(listing);
        return of(listing);
      })
    );
  }

  updateListing(listing: Listing): Observable<Listing> {
    return this.http.put<Listing>(`${this.apiUrl}/${listing.id}`, listing).pipe(
      catchError(() => {
        const index = this.mockListings.findIndex(l => l.id === listing.id);
        if (index !== -1) {
          this.mockListings[index] = listing;
        }
        return of(listing);
      })
    );
  }

  deleteListing(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        this.mockListings = this.mockListings.filter(listing => listing.id !== id);
        return of(undefined);
      })
    );
  }

  /* filtering and sorting */

  // listing.service.ts (inside ListingService)

  filterListings(
    listings: Listing[],
    selectedCategory: string,
    sortBy: 'price' | 'uploadDate',
    sortOrder: 'asc' | 'desc'
  ): Listing[] {
    let result = [...listings];

    if (selectedCategory) {
      result = result.filter(listing => listing.category === selectedCategory);
    }

    result.sort((a, b) => {
      if (sortBy === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      } else {
        const dateA = new Date(a.uploadDate).getTime();
        const dateB = new Date(b.uploadDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    return result;
  }

  // async adding logic

  private newListings: Listing[] = [
    { id: uuidv4(), title: 'Electric Scooter', category: 'Vehicles', price: 25, description: 'Fast and efficient electric scooter.', owner: 'user6', uploadDate: '2025-03-25', location: 'Ilfov' },
    { id: uuidv4(), title: 'Camping Tent', category: 'Home', price: 10, description: 'Spacious tent for outdoor adventures.', owner: 'user7', uploadDate: '2025-03-26', location: 'Brasov' },
    { id: uuidv4(), title: 'VR Headset', category: 'Technology', price: 30, description: 'High-end virtual reality headset.', owner: 'user8', uploadDate: '2025-03-27', location: 'Sibiu' },
    { id: uuidv4(), title: 'Lawn Mower', category: 'Garden', price: 15, description: 'Electric lawn mower available for short-term rental.', owner: 'user1', uploadDate: '2024-12-25', location: 'Cluj' },
    { id: uuidv4(), title: 'Physics Textbook', category: 'Education', price: 5, description: 'University-level physics textbook in great condition.', owner: 'me', uploadDate: '2025-02-28', location: 'Dolj' },
    { id: uuidv4(), title: 'Gaming Laptop', category: 'Computers', price: 50, description: 'High-performance gaming laptop available for rent.', owner: 'user3', uploadDate: '2025-03-15', location: 'Cluj' },
    { id: uuidv4(), title: 'Car Jack', category: 'Vehicles', price: 10, description: 'Hydraulic car jack, great for repairs.', owner: 'user4', uploadDate: '2024-12-10', location: 'Prahova' },
    { id: uuidv4(), title: 'Smartphone Gimbal', category: 'Technology', price: 20, description: 'Stabilizer for smooth video recording.', owner: 'user5', uploadDate: '2025-03-05', location: 'Tulcea' },
    { id: uuidv4(), title: 'Lawn Mower', category: 'Garden', price: 15, description: 'Electric lawn mower available for short-term rental.', owner: 'user1', uploadDate: '2025-03-20', location: 'Cluj' },
    { id: uuidv4(), title: 'Physics Textbook', category: 'Education', price: 5, description: 'University-level physics textbook in great condition.', owner: 'me', uploadDate: '2024-02-28', location: 'Dolj' },
    { id: uuidv4(), title: 'Gaming Laptop', category: 'Computers', price: 50, description: 'High-performance gaming laptop available for rent.', owner: 'user3', uploadDate: '2024-11-15', location: 'Cluj' },
    { id: uuidv4(), title: 'Car Jack', category: 'Vehicles', price: 10, description: 'Hydraulic car jack, great for repairs.', owner: 'user4', uploadDate: '2024-08-10', location: 'Prahova' },
    { id: uuidv4(), title: 'Smartphone Gimbal', category: 'Technology', price: 20, description: 'Stabilizer for smooth video recording.', owner: 'user5', uploadDate: '2024-09-15', location: 'Tulcea' }
  ];

  getNewListings(): Listing[] {
    return [...this.newListings];
  }

  startAsyncAdding(
    newListings: Listing[],
    onListingAdded: (listing: Listing) => void,
    onComplete: () => void
  ): any {
    let index = 0;
    const interval = setInterval(() => {
      if (index < newListings.length) {
        this.addListing(newListings[index]).subscribe((created) => {
          onListingAdded(created);
          index++;
        });
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);

    return interval;
  }

  // Offline support
}
