import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingService } from '../listing.service/listing.service';
import { Listing } from '../models/listing.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';  // Import FormsModule
import { HttpClient, HttpClientModule } from '@angular/common/http';  // Import HttpClientModule
import { v4 as uuidv4 } from 'uuid';

Chart.register(...registerables);

@Component({
  selector: 'app-listings-page',
  templateUrl: './listings-page.component.html',
  styleUrls: ['./listings-page.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],  // Add FormsModule and HttpClientModule here
  providers: [ListingService]  // Provide ListingService here
})
export class ListingsPageComponent implements OnInit {
  
  listings: Listing[] = [];
  filteredListings: Listing[] = [];
  paginatedListings: Listing[] = [];

  selectedCategory: string = '';
  categories = ['Home', 'Garden', 'Education', 'Vehicles', 'Technology', 'Computers', 'Clothing'];
  sortOrder: 'asc' | 'desc' = 'asc';
  sortBy: 'price' | 'uploadDate' = 'price';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  constructor(private listingService: ListingService) {}

  ngOnInit() {
    this.fetchListings();
    this.filteredListings = [...this.listings];
    this.updatePagination();
    setTimeout(() => {
      this.generateCharts();
    },1000);
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

  fetchListings() {
    this.listingService.getListings().subscribe((data) => {
      this.listings = data;
      this.filteredListings = [...this.listings];
      this.updatePagination();
    });
  }

  addListing(newListing: Listing) {
    this.listingService.addListing(newListing).subscribe((createdListing) => {
      this.listings.push(createdListing);
      this.filteredListings = [...this.listings];
      this.updatePagination();
    });
  }

  deleteListing(id: string) {
    this.listingService.deleteListing(id).subscribe(() => {
      this.listings = this.listings.filter(listing => listing.id !== id);
      this.filteredListings = [...this.listings];
      this.updatePagination();
    });
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredListings.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages) || 1;
    this.paginatedListings = this.filteredListings.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
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

  
  /* filtering area */

  filterByCategory() {
    this.filteredListings = this.listingService.filterListings(
      this.listings,
      this.selectedCategory,
      this.sortBy,
      this.sortOrder
    );
    this.updatePagination();
  }
  

  sortListings() {
    this.filteredListings = this.listingService.filterListings(
      this.listings,
      this.selectedCategory,
      this.sortBy,
      this.sortOrder
    );
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

// Adding listings asynchronously

  addingInterval: any = null;
  currentIndex: number = 0;

  startAddingListings() {
    if (this.addingInterval) {
      clearInterval(this.addingInterval);
      this.addingInterval = null;
      return;
    }
  
    const newListings = this.listingService.getNewListings();
  
    this.addingInterval = this.listingService.startAsyncAdding(
      newListings,
      (createdListing: Listing) => {
        this.listings.push(createdListing);
        this.filteredListings = this.listingService.filterListings(
          this.listings,
          this.selectedCategory,
          this.sortBy,
          this.sortOrder
        );
        this.updatePagination();
        this.generateCharts();
      },
      () => {
        this.addingInterval = null;
      }
    );
  }

}



