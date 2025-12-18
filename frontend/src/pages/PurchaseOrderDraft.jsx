import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './PurchaseOrderDraft.css';

const PurchaseOrderDraft = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Material');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const categories = [
    { value: 'Material', label: 'Material' },
    { value: 'Preps', label: 'Preps' },
    { value: 'Accessories', label: 'Accessories' },
    { value: 'Packaging', label: 'Packaging' },
    { value: 'Finish Product', label: 'Finish Product' }
  ];

  const fetchPurchaseOrderDraft = async (category) => {
    if (!user?.ID && !user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    const vendorId = user.ID || user.id;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(
        `${API_BASE_URL}/api/purchase-order-draft?category=${category}&vendorId=${vendorId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      // Redirect on 404
      if (response.status === 404) {
        window.location.href = '/login';
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data || []);
        setTotalCount(data.count || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch purchase order draft data');
      }
    } catch (err) {
      console.error('Error fetching purchase order draft:', err);
      setError(err.message || 'Failed to fetch purchase order draft data');
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.ID || user?.id) {
      fetchPurchaseOrderDraft(selectedCategory);
    }
  }, [selectedCategory, user?.ID, user?.id]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

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

  const handleRefresh = () => {
    fetchPurchaseOrderDraft(selectedCategory);
  };

  const printDrafts = () => {
    const now = new Date().toLocaleString();
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Purchase Order Draft</title>
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
          <h1>Purchase Order Draft</h1>
          <div class="meta">Generated: ${now} • Category: ${selectedCategory} • Total: ${totalCount}</div>
          <table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Order No.</th>
                <th>Order Date</th>
                <th>Item Code</th>
                <th>Old Code</th>
                <th>Description</th>
                <th class="right">Reserve Qty</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td>${o.Vendor ?? ''}</td>
                  <td>${o.OrderNo ?? ''}</td>
                  <td>${o.OrderDate ? new Date(o.OrderDate).toLocaleDateString() : ''}</td>
                  <td>${o.ItemCode ?? ''}</td>
                  <td>${o.OldCode ?? ''}</td>
                  <td>${o.Description ?? ''}</td>
                  <td class="right">${o.ReserveQty ?? ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="small">This print reflects the current category selection.</div>
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

  // Redirect to login if not authenticated
   useEffect(() => {
     if (!isAuthenticated) {
       navigate('/login');
     }
   }, [isAuthenticated, navigate]);

   if (!isAuthenticated || !user) {
     return (
       <div className="purchase-order-draft">
         <div className="container">
           <h1>Purchase Order Draft</h1>
           <p>Redirecting to login...</p>
         </div>
       </div>
     );
   }

  return (
    <div className="purchase-order-draft">
      <div className="purchase-order-draft-container">
        <header className="purchase-order-draft-header">
          <h1>Purchase Order Draft</h1>
          <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
            🔄 Refresh
          </button>
          <button onClick={printDrafts} className="refresh-btn" style={{ marginLeft: '8px' }} disabled={loading}>
            🖨️ Print
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

        {/* Summary */}
        <div className="orders-summary">
          <p>
            Showing {totalCount} {selectedCategory.toLowerCase()} draft orders
            {user?.companyName && ` for ${user.companyName}`}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading {selectedCategory.toLowerCase()} draft orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={handleRefresh} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

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

        {/* Orders Table */}
        {!loading && !error && (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Order No.</th>
                  <th>Order Date</th>
                  <th>Item Code</th>
                  <th>Old Code</th>
                  <th>Description</th>
                  <th>Reserve Qty</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No {selectedCategory.toLowerCase()} draft orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr key={index}>
                      <td>{order.Vendor}</td>
                      <td>{order.OrderNo}</td>
                      <td>{order.OrderDate ? new Date(order.OrderDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{order.ItemCode}</td>
                      <td>{order.OldCode || 'N/A'}</td>
                      <td className="description">{order.Description}</td>
                      <td className="reserve-qty">{order.ReserveQty}</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDraft;
