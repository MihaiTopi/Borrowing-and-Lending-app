import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Listing } from '../models/listing.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-listings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listings-page.component.html',
  styleUrls: ['./listings-page.component.css']
})
export class ListingsPageComponent implements OnInit {
  
  listings: Listing[] = [];
  filteredListings: Listing[] = [];
  paginatedListings: Listing[] = []; // Listings displayed on current page

  selectedCategory: string = '';
  categories = ['Home', 'Garden', 'Education', 'Vehicles', 'Technology', 'Computers', 'Clothing'];
  sortOrder: 'asc' | 'desc' = 'asc';
  sortBy: 'price' | 'uploadDate' = 'price';

  // Pagination variables
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  ngOnInit() {
    const storedListings = localStorage.getItem('listings');

    if (!storedListings) {
      const initialListings: Listing[] = [
        { id: crypto.randomUUID(), title: 'Lawn Mower', category: 'Garden', price: 15, description: 'Electric lawn mower available for short-term rental.', owner: 'user1', uploadDate: '2024-12-25', location: 'Cluj' },
        { id: crypto.randomUUID(), title: 'Physics Textbook', category: 'Education', price: 5, description: 'University-level physics textbook in great condition.', owner: 'me', uploadDate: '2025-02-28', location: 'Dolj' },
        { id: crypto.randomUUID(), title: 'Gaming Laptop', category: 'Computers', price: 50, description: 'High-performance gaming laptop available for rent.', owner: 'user3', uploadDate: '2025-03-15', location: 'Cluj' },
        { id: crypto.randomUUID(), title: 'Car Jack', category: 'Vehicles', price: 10, description: 'Hydraulic car jack, great for repairs.', owner: 'user4', uploadDate: '2024-12-10', location: 'Prahova' },
        { id: crypto.randomUUID(), title: 'Smartphone Gimbal', category: 'Technology', price: 20, description: 'Stabilizer for smooth video recording.', owner: 'user5', uploadDate: '2025-03-05', location: 'Tulcea' },
        { id: crypto.randomUUID(), title: 'Lawn Mower', category: 'Garden', price: 15, description: 'Electric lawn mower available for short-term rental.', owner: 'user1', uploadDate: '2025-03-20', location: 'Cluj' },
        { id: crypto.randomUUID(), title: 'Physics Textbook', category: 'Education', price: 5, description: 'University-level physics textbook in great condition.', owner: 'me', uploadDate: '2024-02-28', location: 'Dolj' },
        { id: crypto.randomUUID(), title: 'Gaming Laptop', category: 'Computers', price: 50, description: 'High-performance gaming laptop available for rent.', owner: 'user3', uploadDate: '2024-11-15', location: 'Cluj' },
        { id: crypto.randomUUID(), title: 'Car Jack', category: 'Vehicles', price: 10, description: 'Hydraulic car jack, great for repairs.', owner: 'user4', uploadDate: '2024-08-10', location: 'Prahova' },
        { id: crypto.randomUUID(), title: 'Smartphone Gimbal', category: 'Technology', price: 20, description: 'Stabilizer for smooth video recording.', owner: 'user5', uploadDate: '2024-09-15', location: 'Tulcea' }
      ];

      localStorage.setItem('listings', JSON.stringify(initialListings));
      this.listings = initialListings;
    } else {
      this.listings = JSON.parse(storedListings);
    }

    this.generateCharts();
    this.filteredListings = [...this.listings];
    this.updatePagination();
  }

  filterByCategory() {
    if (this.selectedCategory) {
      this.filteredListings = this.listings.filter(listing => listing.category === this.selectedCategory);
    } else {
      this.filteredListings = [...this.listings];
    }
    this.sortListings();
    this.updatePagination();
  }

  sortListings() {
    this.filteredListings.sort((a, b) => {
      if (this.sortBy === 'price') {
        return this.sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      } else {
        const dateA = new Date(a.uploadDate).getTime();
        const dateB = new Date(b.uploadDate).getTime();
        return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
    this.updatePagination();
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortListings();
  }

  changeSortBy(sortBy: 'price' | 'uploadDate') {
    this.sortBy = sortBy;
    this.sortListings();
  }

  // Pagination methods
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredListings.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages) || 1;
    this.paginatedListings = this.filteredListings.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  changeItemsPerPage(count: number) {
    this.itemsPerPage = count;
    this.currentPage = 1;
    this.updatePagination();
  }

  getBorderColor(uploadDate: string): string {
    const sortedListings = [...this.listings].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    const totalListings = sortedListings.length;

    const oneThird = Math.floor(totalListings / 3);
    const twoThirds = 2 * oneThird;

    const listingIndex = sortedListings.findIndex(listing => listing.uploadDate === uploadDate);

    if (listingIndex < oneThird) {
      return 'recent'; 
    } else if (listingIndex < twoThirds) {
      return 'mid-recent'; 
    } else {
      return 'old'; 
    }
  }

  priceChart!: Chart | null;
  categoryChart!: Chart | null;
  monthlyChart!: Chart | null;

  generateCharts() {
    this.destroyCharts();
  
    this.generatePriceChart();
    this.generateCategoryChart();
    this.generateMonthlyChart();
  }
  
  destroyCharts() {
    if (this.priceChart) {
      this.priceChart.destroy();
      this.priceChart = null;
    }
    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.categoryChart = null;
    }
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
      this.monthlyChart = null;
    }
  }

  generatePriceChart() {
    const highPriceListings = this.listings.filter(listing => listing.price >= 20);
    const categoryCounts = this.countByCategory(highPriceListings);
  
    this.priceChart = new Chart('priceChart', {
      type: 'bar',
      data: {
        labels: Object.keys(categoryCounts),
        datasets: [{
          label: 'Listings with Price ≥ 20',
          data: Object.values(categoryCounts),
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      }
    });
  }
  
  generateCategoryChart() {
    const categoryCounts = this.countByCategory(this.listings);
  
    this.categoryChart = new Chart('categoryChart', {
      type: 'bar',
      data: {
        labels: Object.keys(categoryCounts),
        datasets: [{
          label: 'Listings per Category',
          data: Object.values(categoryCounts),
          backgroundColor: 'rgba(255, 99, 132, 0.6)'
        }]
      }
    });
  }
  
  generateMonthlyChart() {
    const currentMonth = new Date().getMonth();
    const monthlyListings = this.listings.filter(listing => new Date(listing.uploadDate).getMonth() === currentMonth);
    const categoryCounts = this.countByCategory(monthlyListings);
  
    this.monthlyChart = new Chart('monthlyChart', {
      type: 'bar',
      data: {
        labels: Object.keys(categoryCounts),
        datasets: [{
          label: 'Listings Uploaded This Month',
          data: Object.values(categoryCounts),
          backgroundColor: 'rgba(75, 192, 192, 0.6)'
        }]
      }
    });
  }  

  countByCategory(listings: Listing[]) {
    return listings.reduce((acc: Record<string, number>, listing) => {
      acc[listing.category] = (acc[listing.category] || 0) + 1;
      return acc;
    }, {});
  }

  // HERE I ADD LISTINGS TO SEE IF THE CHARTS UPDATE LIVE

  newListings: Listing[] = [ //there are the test listings
    { id: crypto.randomUUID(), title: 'Electric Scooter', category: 'Vehicles', price: 25, description: 'Fast and efficient electric scooter.', owner: 'user6', uploadDate: '2025-03-25', location: 'Ilfov' },
    { id: crypto.randomUUID(), title: 'Camping Tent', category: 'Home', price: 10, description: 'Spacious tent for outdoor adventures.', owner: 'user7', uploadDate: '2025-03-26', location: 'Brasov' },
    { id: crypto.randomUUID(), title: 'VR Headset', category: 'Technology', price: 30, description: 'High-end virtual reality headset.', owner: 'user8', uploadDate: '2025-03-27', location: 'Sibiu' },
    { id: crypto.randomUUID(), title: 'Lawn Mower', category: 'Garden', price: 15, description: 'Electric lawn mower available for short-term rental.', owner: 'user1', uploadDate: '2024-12-25', location: 'Cluj' },
        { id: crypto.randomUUID(), title: 'Physics Textbook', category: 'Education', price: 5, description: 'University-level physics textbook in great condition.', owner: 'me', uploadDate: '2025-02-28', location: 'Dolj' },
        { id: crypto.randomUUID(), title: 'Gaming Laptop', category: 'Computers', price: 50, description: 'High-performance gaming laptop available for rent.', owner: 'user3', uploadDate: '2025-03-15', location: 'Cluj' },
        { id: crypto.randomUUID(), title: 'Car Jack', category: 'Vehicles', price: 10, description: 'Hydraulic car jack, great for repairs.', owner: 'user4', uploadDate: '2024-12-10', location: 'Prahova' },
        { id: crypto.randomUUID(), title: 'Smartphone Gimbal', category: 'Technology', price: 20, description: 'Stabilizer for smooth video recording.', owner: 'user5', uploadDate: '2025-03-05', location: 'Tulcea' },
        { id: crypto.randomUUID(), title: 'Lawn Mower', category: 'Garden', price: 15, description: 'Electric lawn mower available for short-term rental.', owner: 'user1', uploadDate: '2025-03-20', location: 'Cluj' },
        { id: crypto.randomUUID(), title: 'Physics Textbook', category: 'Education', price: 5, description: 'University-level physics textbook in great condition.', owner: 'me', uploadDate: '2024-02-28', location: 'Dolj' },
        { id: crypto.randomUUID(), title: 'Gaming Laptop', category: 'Computers', price: 50, description: 'High-performance gaming laptop available for rent.', owner: 'user3', uploadDate: '2024-11-15', location: 'Cluj' },
        { id: crypto.randomUUID(), title: 'Car Jack', category: 'Vehicles', price: 10, description: 'Hydraulic car jack, great for repairs.', owner: 'user4', uploadDate: '2024-08-10', location: 'Prahova' },
        { id: crypto.randomUUID(), title: 'Smartphone Gimbal', category: 'Technology', price: 20, description: 'Stabilizer for smooth video recording.', owner: 'user5', uploadDate: '2024-09-15', location: 'Tulcea' }
  ];
  
  addingInterval: any = null;
  currentIndex: number = 0;

  startAddingListings() {
    if (this.addingInterval) {
      clearInterval(this.addingInterval);
      this.addingInterval = null;
      return;
    }
  
    this.addingInterval = setInterval(() => {
      if (this.currentIndex < this.newListings.length) {
        this.listings.push(this.newListings[this.currentIndex]);
        localStorage.setItem('listings', JSON.stringify(this.listings));
        
        this.filteredListings = [...this.listings];
        this.updatePagination();

        this.generateCharts(); 
  
        this.currentIndex++;
      } else {
        clearInterval(this.addingInterval);
        this.addingInterval = null;
      }
    }, 5000);
  }
  
  
}
