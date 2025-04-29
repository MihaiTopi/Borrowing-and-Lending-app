import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, catchError, BehaviorSubject } from 'rxjs';
import { Listing } from '../models/listing.model';
import { v4 as uuidv4 } from 'uuid';

interface QueueItem {
  type: 'add' | 'update' | 'delete';
  data: Listing | string; // Listing for add/update, string (id) for delete
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private apiUrl = 'http://192.168.64.129:3000/api/listings';
  
  // Track network and server status internally
  private isOfflineSubject = new BehaviorSubject<boolean>(false);
  private isServerDownSubject = new BehaviorSubject<boolean>(false);
  private syncInProgressSubject = new BehaviorSubject<boolean>(false);
  
  private offlineQueue: QueueItem[] = [];
  private readonly QUEUE_STORAGE_KEY = 'offline_listings_queue';
  
  constructor(private http: HttpClient) {
    // Load queue from localStorage on service initialization
    this.loadQueueFromStorage();
    
    this.checkServerAndSync();
  }
  
  // Check server and sync if possible
  private checkServerAndSync() {
    if (this.isOfflineSubject.value) return;
    
    // Simple ping to check server status
    this.http.get<any>(`${this.apiUrl}/ping`).pipe(
      catchError((error: HttpErrorResponse) => {
        this.isServerDownSubject.next(true);
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.isServerDownSubject.next(false);
        this.syncOfflineChanges().subscribe();
      }
    });
  }
  
  // CRUD operations with offline support
  getListings(): Observable<Listing[]> {
    if (this.isOfflineSubject.value || this.isServerDownSubject.value) {
      // If offline or server down, return cached listings
      const cachedData = localStorage.getItem('cached_listings');
      if (cachedData) {
        return of(JSON.parse(cachedData));
      }
      return of([]); // Empty array if no cache
    }
    
    return this.http.get<Listing[]>(this.apiUrl).pipe(
      catchError((error: HttpErrorResponse) => {
        
        // Return cached data if available
        const cachedData = localStorage.getItem('cached_listings');
        if (cachedData) {
          return of(JSON.parse(cachedData));
        }
        return of([]);
      })
    );
  }
  
  addListing(listing: Listing): Observable<Listing> {
    if (!listing.id) listing.id = uuidv4();
    
    // If offline or server down, queue for later
    if (this.isOfflineSubject.value || this.isServerDownSubject.value) {
      this.addToQueue({ type: 'add', data: listing });
      this.updateLocalCache(listing, 'add');
      return of(listing);
    }
    
    return this.http.post<Listing>(this.apiUrl, listing).pipe(
      catchError((error: HttpErrorResponse) => {

        // Queue for later
        this.addToQueue({ type: 'add', data: listing });
        this.updateLocalCache(listing, 'add');
        
        console.warn('Operation queued for later', listing);
        return of(listing); // Return optimistic result
      })
    );
  }
  
  updateListing(listing: Listing): Observable<Listing> {
    if (this.isOfflineSubject.value || this.isServerDownSubject.value) {
      this.addToQueue({ type: 'update', data: listing });
      this.updateLocalCache(listing, 'update');
      return of(listing);
    }
    
    return this.http.put<Listing>(`${this.apiUrl}/${listing.id}`, listing).pipe(
      catchError((error: HttpErrorResponse) => {
        
        this.addToQueue({ type: 'update', data: listing });
        this.updateLocalCache(listing, 'update');
        
        console.warn('Update queued for later', listing);
        return of(listing);
      })
    );
  }
  
  deleteListing(id: string): Observable<void> {
    if (this.isOfflineSubject.value || this.isServerDownSubject.value) {
      this.addToQueue({ type: 'delete', data: id });
      this.updateLocalCache(id, 'delete');
      return of(undefined);
    }
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        
        this.addToQueue({ type: 'delete', data: id });
        this.updateLocalCache(id, 'delete');
        
        console.warn('Delete queued for later', id);
        return of(undefined);
      })
    );
  }
  
  // Queue management
  private addToQueue(item: Omit<QueueItem, 'timestamp'>) {
    const queueItem: QueueItem = {
      ...item,
      timestamp: Date.now()
    };
    
    this.offlineQueue.push(queueItem);
    this.saveQueueToStorage();
  }
  
  private saveQueueToStorage() {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem(this.QUEUE_STORAGE_KEY, JSON.stringify(this.offlineQueue));
    }
  }  
  
  private loadQueueFromStorage() {
    if (typeof window !== 'undefined' && localStorage) {
      const storedQueue = localStorage.getItem(this.QUEUE_STORAGE_KEY);
      if (storedQueue) {
        this.offlineQueue = JSON.parse(storedQueue);
      }
    }
  }  
  
  // Local cache management
  private updateLocalCache(item: Listing | string, operation: 'add' | 'update' | 'delete') {
    if (typeof window === 'undefined' || !localStorage) return;
  
    const cachedData = localStorage.getItem('cached_listings');
    let listings: Listing[] = cachedData ? JSON.parse(cachedData) : [];
  
    if (operation === 'add' && typeof item !== 'string') {
      listings.push(item);
    } else if (operation === 'update' && typeof item !== 'string') {
      const index = listings.findIndex(l => l.id === item.id);
      if (index !== -1) {
        listings[index] = item;
      }
    } else if (operation === 'delete' && typeof item === 'string') {
      listings = listings.filter(l => l.id !== item);
    }
  
    localStorage.setItem('cached_listings', JSON.stringify(listings));
  }
  
  
  // Synchronization logic
  syncOfflineChanges(): Observable<boolean> {
    if (this.offlineQueue.length === 0) {
      return of(true); // Nothing to sync
    }
    
    if (this.isOfflineSubject.value || this.isServerDownSubject.value) {
      return of(false); // Cannot sync now
    }
    
    this.syncInProgressSubject.next(true);
    
    return new Observable<boolean>(observer => {
      const processQueue = async () => {
        const queue = [...this.offlineQueue];
        let success = true;
        
        for (const item of queue) {
          try {
            if (item.type === 'add' && typeof item.data !== 'string') {
              await this.http.post<Listing>(this.apiUrl, item.data).toPromise();
            } else if (item.type === 'update' && typeof item.data !== 'string') {
              await this.http.put<Listing>(`${this.apiUrl}/${item.data.id}`, item.data).toPromise();
            } else if (item.type === 'delete' && typeof item.data === 'string') {
              await this.http.delete<void>(`${this.apiUrl}/${item.data}`).toPromise();
            }
            
            // Remove processed item from queue
            const index = this.offlineQueue.findIndex(
              qi => qi.timestamp === item.timestamp && qi.type === item.type
            );
            if (index !== -1) {
              this.offlineQueue.splice(index, 1);
              this.saveQueueToStorage();
            }
          } catch (error) {
            console.error('Failed to sync item', item, error);
            success = false;
            break;
          }
        }
        
        // After sync attempt, refresh cached listings if successful
        if (success) {
          try {
            const freshListings = await this.http.get<Listing[]>(this.apiUrl).toPromise();
            if (freshListings) {
              localStorage.setItem('cached_listings', JSON.stringify(freshListings));
            }
          } catch (error) {
            console.error('Failed to refresh cache after sync', error);
          }
        }
        
        this.syncInProgressSubject.next(false);
        observer.next(success);
        observer.complete();
      };
      
      processQueue();
      
      return {
        unsubscribe() {}
      };
    });
  }
  
  // Get pending changes count
  getPendingChangesCount(): number {
    return this.offlineQueue.length;
  }

  // Your existing methods
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
    // Your existing implementation
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

  // listings page modification
  getListingsPage(page: number, limit: number): Observable<any[]> {
    return this.http.get<any[]>(`http://192.168.64.129:3000/api/listings?page=${page}&limit=${limit}`);
  }

}
