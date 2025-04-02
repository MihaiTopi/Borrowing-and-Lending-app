import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListingsPageComponent } from './listings-page.component';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Listing } from '../models/listing.model';
import { Chart } from 'chart.js';

describe('ListingsPageComponent', () => {
  let component: ListingsPageComponent;
  let fixture: ComponentFixture<ListingsPageComponent>;

  const mockListings: Listing[] = [
    { id: '1', title: 'Item A', category: 'Garden', price: 20, description: 'Desc A', owner: 'user1', uploadDate: '2025-03-10', location: 'Cluj' },
    { id: '2', title: 'Item B', category: 'Education', price: 10, description: 'Desc B', owner: 'user2', uploadDate: '2025-03-15', location: 'Dolj' },
    { id: '3', title: 'Item C', category: 'Technology', price: 30, description: 'Desc C', owner: 'user3', uploadDate: '2025-03-05', location: 'Prahova' },
    { id: '4', title: 'Item D', category: 'Garden', price: 25, description: 'Desc D', owner: 'user4', uploadDate: '2025-02-20', location: 'Cluj' },
    { id: '5', title: 'Item E', category: 'Technology', price: 15, description: 'Desc E', owner: 'user5', uploadDate: '2025-03-01', location: 'Brasov' },
    { id: '6', title: 'Item F', category: 'Education', price: 5, description: 'Desc F', owner: 'user6', uploadDate: '2025-01-15', location: 'Sibiu' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListingsPageComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => '1' } },
            queryParams: of({}),
          },
        },
      ],
    }).compileComponents();

    // Mock Chart.js
    spyOn(Chart, 'register').and.callThrough();
    spyOn(Chart.prototype, 'destroy').and.callThrough();
    spyOn(Chart.prototype, 'update').and.callThrough();

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'listings') return JSON.stringify(mockListings);
      return null;
    });
    spyOn(localStorage, 'setItem');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component.addingInterval) {
      clearInterval(component.addingInterval);
    }
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with listings from localStorage', () => {
    expect(component.listings.length).toBe(mockListings.length);
    expect(component.listings[0].title).toBe('Item A');
    expect(localStorage.getItem).toHaveBeenCalledWith('listings');
  });

  it('should initialize with default listings when localStorage is empty', () => {
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);
    
    fixture = TestBed.createComponent(ListingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.listings.length).toBeGreaterThan(0);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should change the sorting order when toggleSortOrder is called', () => {
    expect(component.sortOrder).toBe('asc');
    component.toggleSortOrder();
    expect(component.sortOrder).toBe('desc');
    component.toggleSortOrder();
    expect(component.sortOrder).toBe('asc');
  });

  it('should sort listings by price ascending', () => {
    component.sortOrder = 'asc';
    component.sortBy = 'price';
    component.filteredListings = [...mockListings];
    component.sortListings();
    expect(component.filteredListings[0].price).toBe(5);
    expect(component.filteredListings[5].price).toBe(30);
  });

  it('should sort listings by uploadDate descending', () => {
    component.sortOrder = 'desc';
    component.sortBy = 'uploadDate';
    component.filteredListings = [...mockListings];
    component.sortListings();
    expect(component.filteredListings[0].uploadDate).toBe('2025-03-15');
    expect(component.filteredListings[5].uploadDate).toBe('2025-01-15');
  });

  it('should filter listings by category and return only matching items', () => {
    component.selectedCategory = 'Education';
    component.filterByCategory();
    expect(component.filteredListings.length).toBe(2);
    expect(component.filteredListings[0].category).toBe('Education');
    expect(component.filteredListings[1].category).toBe('Education');
  });

  it('should return all listings when no category is selected', () => {
    component.selectedCategory = '';
    component.filterByCategory();
    expect(component.filteredListings.length).toBe(mockListings.length);
  });

  it('should correctly calculate total pages and paginate listings', () => {
    component.filteredListings = mockListings;
    component.itemsPerPage = 2;
    component.updatePagination();

    expect(component.totalPages).toBe(3);
    expect(component.paginatedListings.length).toBe(2);
  });

  it('should change to the specified valid page', () => {
    component.filteredListings = mockListings;
    component.itemsPerPage = 2;
    component.updatePagination();

    component.goToPage(2);
    expect(component.currentPage).toBe(2);
    expect(component.paginatedListings.length).toBe(2);
  });

  it('should not change to an invalid page', () => {
    component.filteredListings = mockListings;
    component.itemsPerPage = 2;
    component.updatePagination();

    component.goToPage(99);
    expect(component.currentPage).toBe(1);
  });

  it('should go to the next page if possible', () => {
    component.filteredListings = mockListings;
    component.itemsPerPage = 2;
    component.updatePagination();

    component.nextPage();
    expect(component.currentPage).toBe(2);
  });
  
  it('should not go to the next page if already on the last page', () => {
    component.filteredListings = mockListings;
    component.itemsPerPage = 2;
    component.currentPage = 3;
    component.updatePagination();

    component.nextPage();
    expect(component.currentPage).toBe(3);
  });

  it('should go to the previous page if possible', () => {
    component.filteredListings = mockListings;
    component.itemsPerPage = 2;
    component.currentPage = 2;
    component.updatePagination();

    component.prevPage();
    expect(component.currentPage).toBe(1);
  });

  it('should not go to a negative page', () => {
    component.filteredListings = mockListings;
    component.itemsPerPage = 2;
    component.currentPage = 1;
    component.updatePagination();

    component.prevPage();
    expect(component.currentPage).toBe(1);
  });

  it('should update pagination when items per page is changed', () => {
    component.filteredListings = mockListings;
    component.changeItemsPerPage(1);
    expect(component.itemsPerPage).toBe(1);
    expect(component.currentPage).toBe(1);
    expect(component.totalPages).toBe(6);
  });

  it('should reset to first page when items per page is changed', () => {
    component.filteredListings = mockListings;
    component.currentPage = 2;
    component.changeItemsPerPage(1);
    expect(component.currentPage).toBe(1);
  });
/*
  it('should return correct border class based on upload date', () => {
    const recentDate = new Date().toISOString().split('T')[0];
    const oldDate = '2024-01-01';
    const midDate = new Date();
    midDate.setMonth(midDate.getMonth() - 4);
    const midDateStr = midDate.toISOString().split('T')[0];
    
    component.listings = [
      { id: '1', title: 'Recent', category: 'Garden', price: 10, description: '', owner: '', uploadDate: recentDate, location: 'Cluj' },
      { id: '2', title: 'Mid', category: 'Garden', price: 10, description: '', owner: '', uploadDate: midDateStr, location: 'Cluj' },
      { id: '3', title: 'Old', category: 'Garden', price: 10, description: '', owner: '', uploadDate: oldDate, location: 'Cluj' }
    ];
    
    expect(component.getBorderColor(recentDate)).toBe('recent');
    expect(component.getBorderColor(midDateStr)).toBe('mid-recent');
    expect(component.getBorderColor(oldDate)).toBe('old');
  });
*/
  it('should generate charts', () => {
    component.generateCharts();
    expect(component.priceChart).toBeDefined();
    expect(component.categoryChart).toBeDefined();
    expect(component.monthlyChart).toBeDefined();
  });

  it('should destroy existing charts before generating new ones', () => {
    component.generateCharts();
    const originalPriceChart = component.priceChart;
    const originalCategoryChart = component.categoryChart;
    const originalMonthlyChart = component.monthlyChart;

    component.generateCharts();
    
    expect(originalPriceChart?.destroy).toHaveBeenCalled();
    expect(originalCategoryChart?.destroy).toHaveBeenCalled();
    expect(originalMonthlyChart?.destroy).toHaveBeenCalled();
  });

  it('should correctly count listings by category', () => {
    const counts = component.countByCategory(mockListings);
    expect(counts['Garden']).toBe(2);
    expect(counts['Education']).toBe(2);
    expect(counts['Technology']).toBe(2);
  });
/*
  it('should add new listings and update charts', () => {
    const newListing: Listing = { 
      id: '7', 
      title: 'New Item', 
      category: 'Home', 
      price: 40, 
      description: 'New desc', 
      owner: 'user7', 
      uploadDate: '2025-03-20', 
      location: 'Cluj' 
    };
    
    component.newListings = [newListing];
    component.currentIndex = 0;
    
    const generateChartsSpy = spyOn(component, 'generateCharts');
    
    component.startAddingListings();
    jasmine.clock().install();
    jasmine.clock().tick(5000);
    
    expect(component.listings.length).toBe(mockListings.length + 1);
    expect(localStorage.setItem).toHaveBeenCalled();
    expect(generateChartsSpy).toHaveBeenCalled();
    expect(component.currentIndex).toBe(1);
    
    jasmine.clock().uninstall();
  });
*/
  it('should stop adding listings when interval is cleared', () => {
    component.newListings = mockListings.slice(0, 2);
    component.currentIndex = 0;
    
    component.startAddingListings();
    component.startAddingListings(); // This should clear the interval
    
    jasmine.clock().install();
    jasmine.clock().tick(5000);
    
    expect(component.listings.length).toBe(mockListings.length);
    expect(component.addingInterval).toBeNull();
    
    jasmine.clock().uninstall();
  });
/*
  it('should reset to first page when filtering', () => {
    component.currentPage = 2;
    component.filterByCategory();
    expect(component.currentPage).toBe(1);
  });

  it('should reset to first page when sorting', () => {
    component.currentPage = 2;
    component.sortListings();
    expect(component.currentPage).toBe(1);
  });

  it('should handle empty listings array for pagination', () => {
    component.filteredListings = [];
    component.updatePagination();
    expect(component.totalPages).toBe(1);
    expect(component.currentPage).toBe(1);
    expect(component.paginatedListings.length).toBe(0);
  });
*/
  it('should handle empty array when sorting', () => {
    component.filteredListings = [];
    component.sortListings();
    expect(component.filteredListings.length).toBe(0);
  });

  it('should handle empty array when filtering', () => {
    component.listings = [];
    component.filterByCategory();
    expect(component.filteredListings.length).toBe(0);
  });
});