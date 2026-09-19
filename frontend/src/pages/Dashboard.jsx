import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import './Dashboard.css';

const DRAFT_CATEGORIES = ['Material', 'Preps', 'Accessories', 'Packaging', 'Finish Product'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [pendingCategories, setPendingCategories] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [draftCounts, setDraftCounts] = useState({});
  const [draftLoading, setDraftLoading] = useState(true);
  const [purchaseCounts, setPurchaseCounts] = useState({});
  const [purchaseLoading, setPurchaseLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchCounts = async () => {
      if (!user?.ID) return;

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

      // Fetch pending orders counts grouped by category
      try {
        const pendingRes = await fetch(
          `${API_BASE_URL}/api/pending-orders/counts?vendorId=${user.ID}`
        );
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setPendingCategories(pendingData.data ?? []);
        } else {
          setPendingCategories([]);
        }
      } catch {
        setPendingCategories([]);
      } finally {
        setPendingLoading(false);
      }

      // Fetch purchase order draft count for each category
      try {
        const results = await Promise.all(
          DRAFT_CATEGORIES.map(async (category) => {
            try {
              const draftRes = await fetch(
                `${API_BASE_URL}/api/purchase-order-draft?vendorId=${user.ID}&category=${encodeURIComponent(category)}`
              );
              if (draftRes.ok) {
                const draftData = await draftRes.json();
                return { category, count: draftData.count ?? draftData.data?.length ?? 0 };
              }
            } catch {
              // counted as zero below
            }
            return { category, count: 0 };
          })
        );

        setDraftCounts(
          results.reduce((acc, item) => {
            acc[item.category] = item.count;
            return acc;
          }, {})
        );
      } catch {
        setDraftCounts({});
      } finally {
        setDraftLoading(false);
      }

      // Fetch purchase orders count for each category
      try {
        const results = await Promise.all(
          DRAFT_CATEGORIES.map(async (category) => {
            try {
              const purchaseRes = await fetch(
                `${API_BASE_URL}/api/purchase-orders?vendorId=${user.ID}&category=${encodeURIComponent(category)}`
              );
              if (purchaseRes.ok) {
                const purchaseData = await purchaseRes.json();
                return { category, count: purchaseData.count ?? purchaseData.data?.length ?? 0 };
              }
            } catch {
              // counted as zero below
            }
            return { category, count: 0 };
          })
        );

        setPurchaseCounts(
          results.reduce((acc, item) => {
            acc[item.category] = item.count;
            return acc;
          }, {})
        );
      } catch {
        setPurchaseCounts({});
      } finally {
        setPurchaseLoading(false);
      }
    };

    fetchCounts();
  }, [isAuthenticated, navigate, user?.ID]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Welcome to Your Dashboard</h1>
          {/* <button onClick={handleLogout} className="logout-btn">
            Logout
          </button> */}
           <h2>Hello, {user.ContactPerson || user.VendorName}!</h2>
        </header>

        {/* <div className="user-welcome">
          <h2>Hello, {user.ContactPerson || user.VendorName}!</h2>
        ----  <p>Welcome back to your VES dashboard.</p>
        </div> */}

        <div className="dashboard-content">
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Purchase Orders</h3>
              <div className="stat-summary">
                <div className="stat-total">
                  <div className="stat-value">
                    {!purchaseLoading && purchaseCounts ? (
                      DRAFT_CATEGORIES.reduce((sum, c) => sum + (purchaseCounts[c] || 0), 0)
                    ) : (
                      <span className="stat-loading">...</span>
                    )}
                  </div>
                  <div className="stat-label">total purchase orders</div>
                </div>
                <div className="stat-card-grid">
                  {DRAFT_CATEGORIES.map((category) => (
                    <Link
                      key={category}
                      to="/purchase-orders"
                      className="stat-card"
                      title={`View ${category} purchase orders`}
                    >
                      <span className="stat-card-count">
                        {!purchaseLoading && purchaseCounts ? (
                          purchaseCounts[category] ?? 0
                        ) : (
                          <span className="stat-loading">...</span>
                        )}
                      </span>
                      <span className="stat-card-label">{category}</span>
                    </Link>
                  ))}
                </div>
                <Link to="/purchase-orders" className="action-btn">
                  <Icon name="shoppingCart" size={16} /> View Purchase Orders
                </Link>
              </div>
            </div>

            <div className="dashboard-card">
              <h3>Pending Orders</h3>
              <div className="stat-summary">
                <div className="stat-total">
                  <div className="stat-value">
                    {!pendingLoading ? (
                      pendingCategories.reduce((sum, item) => sum + (item.total || 0), 0)
                    ) : (
                      <span className="stat-loading">...</span>
                    )}
                  </div>
                  <div className="stat-label">pending orders created</div>
                </div>
                <div className="stat-card-grid">
                  {pendingLoading ? (
                    <span className="stat-loading">...</span>
                  ) : pendingCategories.length === 0 ? (
                    <div className="stat-label">No pending orders</div>
                  ) : (
                    pendingCategories.map((item) => (
                      <Link
                        key={item.category}
                        to="/pending-orders"
                        className="stat-card"
                        title={`View ${item.category} pending orders`}
                      >
                        <span className="stat-card-count">{item.total}</span>
                        <span className="stat-card-label">{item.category}</span>
                      </Link>
                    ))
                  )}
                </div>
                <Link to="/pending-orders" className="action-btn">
                  <Icon name="list" size={16} /> View Pending Orders
                </Link>
              </div>
            </div>

            <div className="dashboard-card">
              <h3>Purchase Order Draft</h3>
              <div className="stat-summary">
                <div className="stat-total">
                  <div className="stat-value">
                    {!draftLoading && draftCounts ? (
                      DRAFT_CATEGORIES.reduce((sum, c) => sum + (draftCounts[c] || 0), 0)
                    ) : (
                      <span className="stat-loading">...</span>
                    )}
                  </div>
                  <div className="stat-label">total draft orders available</div>
                </div>
                <div className="stat-card-grid">
                  {DRAFT_CATEGORIES.map((category) => (
                    <Link
                      key={category}
                      to="/purchase-order-draft"
                      className="stat-card"
                      title={`View ${category} draft orders`}
                    >
                      <span className="stat-card-count">
                        {!draftLoading && draftCounts ? (
                          draftCounts[category] ?? 0
                        ) : (
                          <span className="stat-loading">...</span>
                        )}
                      </span>
                      <span className="stat-card-label">{category}</span>
                    </Link>
                  ))}
                </div>
                <Link to="/purchase-order-draft" className="action-btn">
                  <Icon name="fileText" size={16} /> View Draft Orders
                </Link>
              </div>
            </div>

            {/* <div className="dashboard-card">
              <h3>System Status</h3>
              <div className="status-info">
                <div className="status-item">
                  <span className="status-indicator active"></span>
                  <span>Database: Connected</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator active"></span>
                  <span>API: Online</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator active"></span>
                  <span>Services: Running</span>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;