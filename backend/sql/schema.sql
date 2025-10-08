-- VOS Database Schema
-- Create database (run this separately if needed)
-- CREATE DATABASE vendor;
-- USE vendor;

-- Vendor table
CREATE TABLE Vendor (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    BusinessEmail NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    CompanyName NVARCHAR(100),
    Ref_Name NVARCHAR(100),
    BusinessPhone NVARCHAR(20),
    Address NVARCHAR(500),
    Since DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    Is_Active BIT DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IX_Vendor_BusinessEmail ON Vendor(BusinessEmail);

-- Insert sample vendor data
INSERT INTO Vendor (BusinessEmail, Password, CompanyName, Ref_Name, BusinessPhone, Address) VALUES
('admin@vos.com', 'admin123', 'VOS Admin', 'Admin User', '+1234567890', '123 Admin Street'),
('vendor@business.com', 'password123', 'Business Vendor', 'John Doe', '+1234567891', '456 Vendor Ave'),
('vendor2@example.com', 'vendor456', 'Example Vendor 2', 'Jane Smith', '+1234567892', '789 Business Blvd');