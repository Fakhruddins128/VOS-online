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
  const [pendingCount, setPendingCount] = useState(null);
  const [draftCounts, setDraftCounts] = useState({});
  const [draftLoading, setDraftLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchCounts = async () => {
      if (!user?.ID) return;

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

      // Fetch pending orders count (limit=1 just to get totalRecords)
      try {
        const pendingRes = await fetch(
          `${API_BASE_URL}/api/pending-orders?vendorId=${user.ID}&limit=1`
        );
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setPendingCount(pendingData.pagination?.totalRecords ?? 0);
        }
      } catch {
        setPendingCount(0);
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
              <h3>Profile Information</h3>
              <div className="user-info">
                <p><strong>Company Name:</strong>  {user.VendorName}</p>
                <p><strong>Business Email:</strong> {user.BusinessEmail}</p>
                <p><strong>Contact Person:</strong> {user.ContactPerson}</p>
              </div>
            </div>

            <div className="dashboard-card">
              <h3>Pending Orders</h3>
              <div className="quick-actions">
                <div className="stat-value">
                  {pendingCount !== null ? pendingCount : <span className="stat-loading">...</span>}
                </div>
                <div className="stat-label">pending orders created</div>
                <Link to="/pending-orders" className="action-btn">
                  <Icon name="list" size={16} /> View Pending Orders
                </Link>
              </div>
            </div>

            <div className="dashboard-card">
              <h3>Purchase Order Draft</h3>
              <div className="draft-summary">
                <div className="draft-total">
                  <div className="stat-value">
                    {!draftLoading && draftCounts ? (
                      DRAFT_CATEGORIES.reduce((sum, c) => sum + (draftCounts[c] || 0), 0)
                    ) : (
                      <span className="stat-loading">...</span>
                    )}
                  </div>
                  <div className="stat-label">total draft orders available</div>
                </div>
                <div className="draft-category-grid">
                  {DRAFT_CATEGORIES.map((category) => (
                    <Link
                      key={category}
                      to="/purchase-order-draft"
                      className="draft-category-card"
                      title={`View ${category} draft orders`}
                    >
                      <span className="draft-category-count">
                        {!draftLoading && draftCounts ? (
                          draftCounts[category] ?? 0
                        ) : (
                          <span className="stat-loading">...</span>
                        )}
                      </span>
                      <span className="draft-category-label">{category}</span>
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