import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { Listing } from '../models/listing.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private apiUrl = 'http://localhost:3000/listings'; 
  //private apiUrl = 'http://localhost:3000/items';

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
}