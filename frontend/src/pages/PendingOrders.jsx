import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import './PendingOrders.css';

const PendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  const categories = [
    { value: 'Material', label: 'Material' },
    { value: 'Preps', label: 'Preps' },
    { value: 'Accessories', label: 'Accessories' },
    { value: 'Packaging', label: 'Packaging' },
    { value: 'Finish Product', label: 'Finish Product' }
  ];
  const [selectedCategory, setSelectedCategory] = useState('Finish Product');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(10);
// Sorting state
  const [sortBy, setSortBy] = useState('OrderNo');
  const [sortOrder, setSortOrder] = useState('DESC');
  
  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const imageTriggerRef = useRef(null);
  const modalCloseBtnRef = useRef(null);
  

  useEffect(() => {
    fetchPendingOrders();
  }, [currentPage, limit, sortBy, sortOrder, search, selectedCategory, user, isAuthenticated]);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated and has vendor ID
      if (!isAuthenticated || !user || !user.ID) {
        setError('User not authenticated or vendor ID not found');
        setLoading(false);
        return;
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        vendorId: user.ID.toString(),
        category: selectedCategory
      });
      if (search) {
        queryParams.append('search', search);
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/pending-orders?${queryParams}`);

      // Redirect on 404
      if (response.status === 404) {
        window.location.href = '/login';
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch pending orders');
      }
      const result = await response.json();
      
      // Handle new API response structure
      setOrders(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalRecords(result.pagination?.totalRecords || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Handle search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setSearchInput('');
    setSearch('');
    setCurrentPage(1);
    setSelectedCategory(category);
  };

  const renderSortableHeader = (label, column) => (
    <th
      scope="col"
      aria-sort={sortBy === column ? (sortOrder === 'ASC' ? 'ascending' : 'descending') : 'none'}
    >
      <button type="button" className="sortable" onClick={() => handleSort(column)}>
        {label} {sortBy === column && (sortOrder === 'ASC' ? '↑' : '↓')}
      </button>
    </th>
  );
  
  // Handle filtering
  
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle image button click
  const handleImageClick = (order) => {
    if (order.Imagepath && order.Picture) {
      imageTriggerRef.current = document.activeElement;
      const imageUrl = `${order.Imagepath}${order.Picture}`;
      setSelectedImage({
        url: imageUrl,
        description: order.Description,
        itemCode: order['Item Code']
      });
      setShowImageModal(true);
    }
  };

  // Close image modal
  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    imageTriggerRef.current?.focus?.();
  };

  useEffect(() => {
    if (!showImageModal) return undefined;
    modalCloseBtnRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowImageModal(false);
        setSelectedImage(null);
        imageTriggerRef.current?.focus?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showImageModal]);
  
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const printOrders = () => {
    const now = new Date().toLocaleString();
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Pending Orders</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
            h1 { margin: 0 0 4px; font-size: 20px; }
            .meta { margin: 0 0 12px; font-size: 12px; color: #555; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { background: #f5f5f5; text-align: left; }
            .right { text-align: right; }
            .small { font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Pending Orders</h1>
          <div class="meta">Generated: ${now} • Category: ${selectedCategory} • Sort: ${sortBy} ${sortOrder} • Page: ${currentPage} • Per page: ${limit} • Total: ${totalRecords}</div>
          <table>
            <thead>
              <tr>
                <th>Order No.</th>
                <th>Date</th>
                <th>Item Code</th>
                <th>Description</th>
                <th class="right">Order</th>
                <th class="right">QC</th>
                <th class="right">Pending</th>
                <th>Delivery Date</th>
                <th>Final Date</th>
                <th class="right">Closing Days</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td>${o['Order #'] ?? ''}</td>
                  <td>${o.Date ?? ''}</td>
                  <td>${o['Item Code'] ?? ''}</td>
                  <td>${o.Description ?? ''}</td>
                  <td class="right">${o.Order ?? ''}</td>
                  <td class="right">${o.QC ?? ''}</td>
                  <td class="right">${o.Pending ?? ''}</td>
                  <td>${o['Delivery Date'] ?? ''}</td>
                  <td>${o['FDDate'] ?? ''}</td>
                  <td class="right">${o.ClosingDays ?? ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="small">This print reflects the current sort and page selection.</div>
        </body>
      </html>
    `;
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
  };

  if (loading) {
    return (
      <div className="pending-orders">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading pending orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pending-orders">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchPendingOrders} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-orders">
      <div className="pending-orders-container">
        <header className="pending-orders-header">
          <h1>Pending Orders</h1>
          <button onClick={fetchPendingOrders} className="refresh-btn">
            <Icon name="refreshCw" size={18} />
            Refresh
          </button>
          <button onClick={printOrders} className="refresh-btn" style={{ marginLeft: '8px' }}>
            <Icon name="printer" size={18} />
            Print
          </button>
        </header>

        {/* Category Radio Buttons */}
        <div className="category-filter">
          <h3>Select Category:</h3>
          <div className="radio-group">
            {categories.map((category) => (
              <label key={category.value} className="radio-option">
                <input
                  type="radio"
                  name="category"
                  value={category.value}
                  checked={selectedCategory === category.value}
                  onChange={() => handleCategoryChange(category.value)}
                  disabled={loading}
                />
                <span className="radio-label">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Search & Toolbar */}
        <div className="orders-toolbar">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Order No. or Item Code..."
              className="search-input"
              aria-label="Search by order number or item code"
            />
            <button type="submit" className="search-btn" disabled={loading}>
              <Icon name="search" size={16} />
            </button>
            {search && (
              <button type="button" className="search-clear" onClick={handleClearSearch}>
                Clear
              </button>
            )}
          </form>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="limit-select"
            aria-label="Rows per page"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                {renderSortableHeader('Order No.', 'OrderNo')}
                {renderSortableHeader('Date', 'Date')}
                {renderSortableHeader('Item Code', 'ItemCode')}
                <th scope="col">Description</th>
                {renderSortableHeader('Order', 'Order')}
                <th scope="col">QC</th>
                {renderSortableHeader('Pending', 'Pending')}
                {renderSortableHeader('Delivery Date', 'DeliveryDate')}
                <th scope="col">Final Date</th>
                {renderSortableHeader('Closing Days', 'ClosingDays')}
                <th scope="col">Image</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    No pending orders found
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={index}>
                    
                    <td>{order['Order #']}</td>
                    <td>{order.Date}</td>
                    <td>{order['Item Code']}</td>
                   
                    <td className="description">{order.Description}</td>
                   
                    <td>{order.Order}</td>
                   
                    <td>{order.QC}</td>
                   
                    <td className="pending">{order.Pending}</td>
                   
                    <td>{order['Delivery Date']}</td>
                    <td>{order['FDDate']}</td>
                    <td className={`closing-days ${order.ClosingDays < 0 ? 'overdue' : ''}`}>
                      {order.ClosingDays}
                    </td>
                    <td>
                      <button
                        className="image-btn"
                        onClick={() => handleImageClick(order)}
                        disabled={!order.Imagepath || !order.Picture}
                        title={order.Imagepath && order.Picture ? 'View Product Image' : 'No image available'}
                        aria-label={order.Imagepath && order.Picture ? 'View product image' : 'No image available'}
                      >
                        <Icon name="image" size={16} />
                      </button>
                    </td>
                    {/* <td>{order['PR Status']}</td>
                    <td>{order.isCost}</td>
                    <td className="price">{order.Price}</td>
                    <td>{order.LastReceive}</td>
                    <td>{order.L_Receive}</td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <div className="image-modal-overlay" onClick={closeImageModal}>
            <div
              className="image-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="image-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="image-modal-header">
                <h3 id="image-modal-title">Product Image</h3>
                <button className="close-btn" onClick={closeImageModal} aria-label="Close" ref={modalCloseBtnRef}>
                  <Icon name="x" size={20} />
                </button>
              </div>
              <div className="image-modal-content">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.description}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="image-error" style={{display: 'none'}}>
                  Image not available
                </div>
                <div className="image-details">
                  <p><strong>Item Code:</strong> {selectedImage.itemCode}</p>
                  <p><strong>Description:</strong> {selectedImage.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="pagination-container">
          <div className="pagination-info">
            <p>Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} orders</p>
          </div>
          <div className="pagination-controls">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ← Previous
            </button>
            
            {/* Page numbers */}
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="orders-summary">
          <p>Total Orders: {totalRecords} | Category: {selectedCategory} | Page {currentPage} of {totalPages}</p>
        </div>
      </div>
    </div>
  );
};

export default PendingOrders;
