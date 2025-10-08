const express = require('express');
const database = require('../config/database');
const router = express.Router();

// GET /api/pending-orders - Get pending orders data with pagination, sorting, and filtering
router.get('/', async (req, res) => {
  try {
    console.log('Fetching pending orders data...');
    
    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      sortBy = 'OrderNo',
      sortOrder = 'DESC',
      vendorId
    } = req.query;
    

    
    // Validate vendor ID
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Base SQL query with proper UNION structure
    let baseQuery = `
      SELECT * FROM (
        (SELECT C2.Description as Category, 
        it.ImageFolderPathOnline as Imagepath,
      OM.OrderNo as 'Order #', 
	 CAST(OM.OrderDate as Date) as Date, 
   
	  (IM.ItemCode+'-'+M.M_Code+'-'+C.Code+'-'+F.Code) as 'Item Code', 
	  AV.OldCode as 'Old Code', 
	  (IM.ProductName+'-'+M.ProductName+'-'+C.Color+'-'+F.Finish) as 'Description', 
	  AV.factoryCode as 'Factory Code', 
	  V.CompanyName as Vendor, 
	  OD.OrderQty as [Order], 
	  ((OD.OrderQty-OD.InQCQty-(OD.OrderQty - OD.RcvdQty))) as Received, 
	  OD.InQCQty as QC, 
	  OD.RejectQty as Reject, 
	  --((OD.OrderQty - (OD.RcvdQty))) as Pending,
      (OD.OrderQty - OD.RcvdQty - OD.AutoClosedPenaltyQty) as Pending, --13-06-25
	  U.UnitName as Unit, 
	  VD.T_Stock as Stock, 
	  --(SELECT TOP 1 Format(AODD.DeilveryDate, 'dd/MM/yy') FROM FinishProductOrderDD AODD WHERE AODD.FK_OrderDetail=OD.ID ORDER BY AODD.ID DESC) as 'Delivery Date', 
	  Format(OD.DeliveryDate, 'dd/MM/yy') as 'Delivery Date', --13-06-25
	  OD.DeliveryDate as 'DDate', --13-06-25
	Format(OD.FinalDeliveryDate, 'dd/MM/yy') as 'FDDate',
	CASE WHEN OD.FinalDeliveryDate IS NOT NULL THEN DATEDIFF(DAY, GETDATE(), OD.FinalDeliveryDate) ELSE NULL END as 'ClosingDays', --13-06-25
    isNULL((SELECT DISTINCT 'PR' FROM FinishProductPOReturn_Detail POR WHERE POR.FK_ODDetail=OD.ID AND POR.ReturnQty>0),'') as 'PR Status', 
	(CASE WHEN isNULL(CAST(OD.CalculatedPrice as money), 0) > 0 THEN 'Y' ELSE 'N' END) as isCost, 
	isNULL(IM.Picture, '') as Picture,
	ISNULL(VD.Picture, '') as VPicture, 
	CAST((((SELECT isNull(SUM(OP.RecipeQty*OP.UnitPrice),0) FROM FinishProductOrderDetail_Prep OP WHERE OP.FK_FinishProductOrderDetail=OD.ID)+isNull(OD.CalculatedPrice-isNull((SELECT SUM(OP.RecipeQty*OP.UnitPrice) FROM FinishProductOrderDetail_Prep OP WHERE OP.FK_FinishProductOrderDetail=OD.ID),0),0))*(CAST((OD.OrderQty - (OD.RcvdQty))as int))) as money) as Price,
	OD.RcvdQty as LastReceive,
	CAST(AV.LastRecDate as date) as L_Receive,
	OD.AutoClosedPenaltyQty --13-06-25
FROM FinishProductOrderMaster OM, FinishProductOrderDetail OD, FinishProductVariantDetail VD, ItemMaster IM, ItemType IT, Vendor V, FP_MaterialMaster M, FP_ColorMaster C, Finish F, ApprovedVendorFinishProduct AV, Unit U, Category3 C3, Category2 C2 WHERE IM.FKItemType = IT.ID AND VD.FK_ItemMasterID = IM.ID AND OM.FK_VendorID = V.ID AND OD.FK_FinishProductOrderMasterID = OM.ID AND AV.FK_FinishProductVariantDetail = VD.ID AND AV.FK_VendorID = V.ID AND OD.FK_FinishProductApprovedVariantID = AV.ID AND Vd.FKMaterialID=M.ID AND VD.FKColourID=C.ID AND VD.FKFinishID=F.ID 
--AND (OD.OrderQty - OD.RcvdQty) > 0 
AND (OD.OrderQty - OD.RcvdQty - OD.AutoClosedPenaltyQty) > 0 --13-06-25
AND OD.Sales_Unit_ID=U.ID AND OD.Status NOT LIKE 'Force Closed' 
AND OD.Status NOT LIKE 'Auto Closed' --14-05-25
AND OM.OrderStat!='Draft' AND C3.FK_Category2ID=C2.ID AND IM.FKSubGroupID=C3.ID AND V.ID=@vendorId) 
--ORDER BY OrderNo DESC, OrderDate ASC, ItemCode DESC
UNION ALL
(SELECT C2.Description as Category, 
it.ImageFolderPathOnline as Imagepath,
    OM.OrderNo as 'Order #', 
	CAST(OM.OrderDate as Date) as Date, 

	(IM.ItemCode+'-'+M.M_Code+'-'+C.Code+'-'+F.Code) as 'Item Code', 
	AV.OldCode as 'Old Code', 
	(IM.ProductName+'-'+M.ProductName+'-'+C.Color+'-'+F.Finish) as 'Description', 
	AV.factoryCode as 'Factory Code', 
	V.CompanyName as Vendor, 
	OD.OrderQty as [Order], 
	((OD.OrderQty-OD.InQCQty-(OD.OrderQty - OD.RcvdQty))) as Received, 
	OD.InQCQty as QC, 
	OD.RejectQty as Reject, 
    (OD.OrderQty - OD.RcvdQty - OD.AutoClosedPenaltyQty) as Pending,
	U.UnitName as Unit, 
	VD.T_Stock as Stock, 
	Format(OD.DeliveryDate, 'dd/MM/yy') as 'Delivery Date',
	OD.DeliveryDate as 'DDate',
	Format(OD.FinalDeliveryDate, 'dd/MM/yy') as 'FDDate',
	CASE WHEN OD.FinalDeliveryDate IS NOT NULL THEN DATEDIFF(DAY, GETDATE(), OD.FinalDeliveryDate) ELSE NULL END as 'ClosingDays',
    isNULL((SELECT DISTINCT 'PR' FROM FinishProductPOReturn_Detail POR WHERE POR.FK_ODDetail=OD.ID AND POR.ReturnQty>0),'') as 'PR Status', 
	(CASE WHEN isNULL(CAST(OD.CalculatedPrice as money), 0) > 0 THEN 'Y' ELSE 'N' END) as isCost, 
	isNULL(IM.Picture, '') as Picture,
	ISNULL(VD.Picture, '') as VPicture, 
	CAST((((SELECT isNull(SUM(OP.RecipeQty*OP.UnitPrice),0) FROM FinishProductOrderDetail_Prep OP WHERE OP.FK_FinishProductOrderDetail=OD.ID)+isNull(OD.CalculatedPrice-isNull((SELECT SUM(OP.RecipeQty*OP.UnitPrice) FROM FinishProductOrderDetail_Prep OP WHERE OP.FK_FinishProductOrderDetail=OD.ID),0),0))*(CAST((OD.OrderQty - (OD.RcvdQty))as int))) as money) as Price,
	OD.RcvdQty as LastReceive,
	CAST(AV.LastRecDate as date) as L_Receive,
	OD.AutoClosedPenaltyQty
FROM FinishProductOrderMaster OM, FinishProductOrderDetail OD, FinishProductVariantDetail VD, ItemMaster IM, ItemType IT, Vendor V, FP_MaterialMaster M, FP_ColorMaster C, Finish F, ApprovedVendorFinishProduct AV, Unit U, Category3 C3, Category2 C2 WHERE IM.FKItemType = IT.ID AND VD.FK_ItemMasterID = IM.ID AND OM.FK_VendorID = V.ID AND OD.FK_FinishProductOrderMasterID = OM.ID AND AV.FK_FinishProductVariantDetail = VD.ID AND AV.FK_VendorID = V.ID AND OD.FK_FinishProductApprovedVariantID = AV.ID AND Vd.FKMaterialID=M.ID AND VD.FKColourID=C.ID AND VD.FKFinishID=F.ID 
AND (OD.OrderQty - OD.RcvdQty - OD.AutoClosedPenaltyQty) = 0
AND OD.InQCQty > 0
AND OD.Sales_Unit_ID=U.ID AND OD.Status NOT LIKE 'Force Closed' 
AND OD.Status NOT LIKE 'Auto Closed'
AND OM.OrderStat!='Draft' AND C3.FK_Category2ID=C2.ID AND IM.FKSubGroupID=C3.ID AND V.ID=@vendorId)
      ) AS UnionResult`;


    
    // Add sorting and pagination to the entire UNION result
    const validSortColumns = {
      'OrderNo': '[Order #]',
      'Date': 'Date',
      'ItemCode': '[Item Code]',
      'Vendor': 'Vendor',
      'Order': '[Order]',
      'Pending': 'Pending',
      'DeliveryDate': '[Delivery Date]',
      'ClosingDays': 'ClosingDays'
    };
    
    const sortColumn = validSortColumns[sortBy] || '[Order #]';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    baseQuery += ` ORDER BY ${sortColumn} ${sortDirection}`;
    
    // Add pagination
    baseQuery += ` OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`;
    
    // Get total count for pagination (including both UNION parts)
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        (SELECT 1 as cnt
        FROM FinishProductOrderMaster OM, FinishProductOrderDetail OD, FinishProductVariantDetail VD, ItemMaster IM, ItemType IT, Vendor V, FP_MaterialMaster M, FP_ColorMaster C, Finish F, ApprovedVendorFinishProduct AV, Unit U, Category3 C3, Category2 C2 
        WHERE IM.FKItemType = IT.ID 
        AND VD.FK_ItemMasterID = IM.ID 
        AND OM.FK_VendorID = V.ID 
        AND OD.FK_FinishProductOrderMasterID = OM.ID 
        AND AV.FK_FinishProductVariantDetail = VD.ID 
        AND AV.FK_VendorID = V.ID 
        AND OD.FK_FinishProductApprovedVariantID = AV.ID 
        AND Vd.FKMaterialID=M.ID 
        AND VD.FKColourID=C.ID 
        AND VD.FKFinishID=F.ID 
        AND V.ID=@vendorId
        AND (OD.OrderQty - OD.RcvdQty - OD.AutoClosedPenaltyQty) > 0 
        AND OD.Sales_Unit_ID=U.ID 
        AND OD.Status NOT LIKE 'Force Closed' 
        AND OD.Status NOT LIKE 'Auto Closed' 
        AND OM.OrderStat!='Draft' 
        AND C3.FK_Category2ID=C2.ID 
        AND IM.FKSubGroupID=C3.ID)
        UNION ALL
        (SELECT 1 as cnt
        FROM FinishProductOrderMaster OM, FinishProductOrderDetail OD, FinishProductVariantDetail VD, ItemMaster IM, ItemType IT, Vendor V, FP_MaterialMaster M, FP_ColorMaster C, Finish F, ApprovedVendorFinishProduct AV, Unit U, Category3 C3, Category2 C2 
        WHERE IM.FKItemType = IT.ID 
        AND VD.FK_ItemMasterID = IM.ID 
        AND OM.FK_VendorID = V.ID 
        AND OD.FK_FinishProductOrderMasterID = OM.ID 
        AND AV.FK_FinishProductVariantDetail = VD.ID 
        AND AV.FK_VendorID = V.ID 
        AND OD.FK_FinishProductApprovedVariantID = AV.ID 
        AND Vd.FKMaterialID=M.ID 
        AND VD.FKColourID=C.ID 
        AND VD.FKFinishID=F.ID 
        AND V.ID=@vendorId
        AND (OD.OrderQty - OD.RcvdQty - OD.AutoClosedPenaltyQty) = 0
        AND OD.InQCQty > 0
        AND OD.Sales_Unit_ID=U.ID 
        AND OD.Status NOT LIKE 'Force Closed' 
        AND OD.Status NOT LIKE 'Auto Closed' 
        AND OM.OrderStat!='Draft' 
        AND C3.FK_Category2ID=C2.ID 
        AND IM.FKSubGroupID=C3.ID)
      ) AS CountUnion`;
    
    // Execute both queries
    const [result, countResult] = await Promise.all([
      database.query(baseQuery, { vendorId: parseInt(vendorId) }),
      database.query(countQuery, { vendorId: parseInt(vendorId) })
    ]);
    
    const totalRecords = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalRecords / parseInt(limit));
    
    // Format the data for frontend consumption
    const formattedData = result.recordset.map(row => {
      // Convert date fields to proper format
      const formattedRow = { ...row };
      
      // Format Date field to YYYY-MM-DD if it exists
      if (row.Date) {
        const date = new Date(row.Date);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
          formattedRow.Date = date.toISOString().split('T')[0];
        } else {
          formattedRow.Date = null;
        }
      }
      
      // Format L_Receive date if it exists
      if (row.L_Receive) {
        const date = new Date(row.L_Receive);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
          formattedRow.L_Receive = date.toISOString().split('T')[0];
        } else {
          formattedRow.L_Receive = null;
        }
      }
      
      // Ensure numeric fields are properly formatted
      ['Order', 'Received', 'QC', 'Reject', 'Pending', 'Stock', 'ClosingDays', 'Price', 'LastReceive', 'AutoClosedPenaltyQty'].forEach(field => {
        if (row[field] !== null && row[field] !== undefined) {
          formattedRow[field] = Number(row[field]) || 0;
        }
      });
      
      return formattedRow;
    });
    
    // Return data with pagination metadata
    res.json({
      data: formattedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      sorting: {
        sortBy,
        sortOrder
      }
    });
    
  } catch (error) {
    console.error('Error fetching pending orders:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending orders',
      message: error.message
    });
  }
});

module.exports = router;