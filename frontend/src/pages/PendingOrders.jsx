import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PendingOrders.css';

const PendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(10);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('OrderNo');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  


  useEffect(() => {
    fetchPendingOrders();
  }, [currentPage, limit, sortBy, sortOrder, user, isAuthenticated]);

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
        vendorId: user.ID.toString()
      });
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/pending-orders?${queryParams}`);
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
  };
  
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
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
            🔄 Refresh
          </button>
        </header>

        {/* Pagination Controls */}
        <div className="pagination-controls-top">
          <select
            value={limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="limit-select"
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
               
                <th onClick={() => handleSort('OrderNo')} className="sortable">
                  Order No. {sortBy === 'OrderNo' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('Date')} className="sortable">
                  Date {sortBy === 'Date' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('ItemCode')} className="sortable">
                  Item Code {sortBy === 'ItemCode' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                
                <th>Description</th>
                
                <th onClick={() => handleSort('Order')} className="sortable">
                  Order {sortBy === 'Order' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                
                <th>QC</th>
               
                <th onClick={() => handleSort('Pending')} className="sortable">
                  Pending {sortBy === 'Pending' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
               
                <th onClick={() => handleSort('DeliveryDate')} className="sortable">
                  Delivery Date {sortBy === 'DeliveryDate' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th>Final Date</th>
                <th onClick={() => handleSort('ClosingDays')} className="sortable">
                  Closing Days {sortBy === 'ClosingDays' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th>Image</th>
                {/* <th>PR Status</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Last Receive</th>
                <th>L_Receive</th> */}
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
                      >
                        📷
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
            <div className="image-modal" onClick={(e) => e.stopPropagation()}>
              <div className="image-modal-header">
                <h3>Product Image</h3>
                <button className="close-btn" onClick={closeImageModal}>×</button>
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
          <p>Total Orders: {totalRecords} | Page {currentPage} of {totalPages}</p>
        </div>
      </div>
    </div>
  );
};

export default PendingOrders;