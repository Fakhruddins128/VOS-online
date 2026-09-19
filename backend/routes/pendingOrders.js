const express = require('express');
const database = require('../config/database');
const router = express.Router();
const debugLog = (...args) => { if (process.env.NODE_ENV !== 'production') console.log(...args); };

// GET /api/pending-orders/counts - Pending order counts grouped by category
router.get('/counts', async (req, res) => {
  try {
    const { vendorId } = req.query;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    const countQuery = `
      SELECT Category, COUNT(*) as total FROM (
        (SELECT C2.Description as Category
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
        (SELECT C2.Description as Category
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
      ) AS CountByCategory
      GROUP BY Category
      ORDER BY Category`;

    const result = await database.query(countQuery, { vendorId: parseInt(vendorId) });

    const rows = result.recordset || result;
    const data = rows.map((row) => ({
      category: row.Category || 'Uncategorized',
      total: Number(row.total) || 0
    }));

    res.json({
      success: true,
      data,
      total: data.reduce((sum, item) => sum + item.total, 0)
    });

  } catch (error) {
    console.error('Error fetching pending order counts:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending order counts',
      message: error.message
    });
  }
});

// GET /api/pending-orders - Get pending orders data with pagination, sorting, and filtering
router.get('/', async (req, res) => {
  try {
    // Replace noisy startup log with dev-only logger
    debugLog('Fetching pending orders data...');

    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      sortBy = 'OrderNo',
      sortOrder = 'DESC',
      vendorId,
      search = '',
      category = 'Finish Product'
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

    // Category-specific FROM/WHERE parts for the non-Finish-Product categories.
    // Builds the same full pending column set that the Finish Product query returns.
    // Table/column names verified against the live schema:
    //   - Accessories tables are plural (AccessoriesOrderDetail, AccessoriesVariantDetail, ApprovedVendorAccessories)
    //   - Non-FP order detail tables have no AutoClosedPenaltyQty/DeliveryDate/FinalDeliveryDate/CalculatedPrice
    //   - Stock is per-category: MaterialVariantDetail/PrepVariantDetail have no T_Stock
    const categoryConfig = {
      Material: {
        categoryLiteral: "'Material'",
        itemCodeExpr: "(IM.ItemCode+'-'+C.Code+'-'+G.Code)",
        descriptionExpr: "IM.ProductName",
        stockExpr: "CASE WHEN AV.InHand IS NULL THEN 0 ELSE AV.InHand END",
        fromClause: `FROM ItemMaster IM, MaterialVariantDetail VD, FP_ColorMaster C, Grade G, ApprovedVendorMaterial AV, Vendor V, MaterialOrderMaster OM, MaterialOrderDetail OD, Unit U, ItemType it`,
        whereClause: `WHERE VD.FK_ItemMasterID=IM.ID AND C.ID=VD.FKColourID AND G.ID=VD.FKGradeID AND AV.FK_VendorID=V.ID AND AV.FK_MaterialVariantDetail=VD.ID AND OD.FK_MaterialOrderMasterID=OM.ID AND OD.FK_MaterialVariantDetailID=AV.ID AND IM.FKItemType=it.ID AND OD.Sales_Unit_ID=U.ID`
      },
      Preps: {
        categoryLiteral: "'Preps'",
        itemCodeExpr: "(IM.ItemCode+'-'+F.Code)",
        descriptionExpr: "IM.ProductName",
        stockExpr: "NULL",
        fromClause: `FROM ItemMaster IM, PrepVariantDetail VD, Finish F, ApprovedVendorPrep AV, Vendor V, PrepOrderMaster OM, PrepOrderDetail OD, Unit U, ItemType it`,
        whereClause: `WHERE VD.FK_ItemMasterID=IM.ID AND AV.FK_VendorID=V.ID AND AV.FK_PrepVariantDetail=VD.ID AND OD.FK_PrepOrderMasterID=OM.ID AND OD.FK_PrepVariantDetailID=AV.ID AND F.ID=VD.FK_FinishID AND IM.FKItemType=it.ID AND OD.Sales_Unit_ID=U.ID`
      },
      Accessories: {
        categoryLiteral: "'Accessories'",
        itemCodeExpr: "(IM.ItemCode+'-'+C.Code)",
        descriptionExpr: "IM.ProductName",
        stockExpr: "VD.T_Stock",
        fromClause: `FROM ItemMaster IM, AccessoriesVariantDetail VD, FP_ColorMaster C, ApprovedVendorAccessories AV, Vendor V, AccessoriesOrderMaster OM, AccessoriesOrderDetail OD, Unit U, ItemType it`,
        whereClause: `WHERE VD.FK_ItemMasterID=IM.ID AND AV.FK_VendorID=V.ID AND AV.FK_AccessoriesVariantDetail=VD.ID AND OD.FK_AccessoriesOrderMasterID=OM.ID AND OD.FK_AccessoriesVariantDetailID=AV.ID AND C.ID=VD.FK_ColourID AND IM.FKItemType=it.ID AND OD.Sales_Unit_ID=U.ID`
      },
      Packaging: {
        categoryLiteral: "'Packaging'",
        itemCodeExpr: "(IM.ItemCode+'-'+C.Code)",
        descriptionExpr: "IM.ProductName",
        stockExpr: "VD.T_Stock",
        fromClause: `FROM ItemMaster IM, PackagingVariantDetail VD, FP_ColorMaster C, ApprovedVendorPackaging AV, Vendor V, PackagingOrderMaster OM, PackagingOrderDetail OD, Unit U, ItemType it`,
        whereClause: `WHERE VD.FK_ItemMasterID=IM.ID AND AV.FK_VendorID=V.ID AND AV.FK_PackagingVariantDetail=VD.ID AND OD.FK_PackagingOrderMasterID=OM.ID AND OD.FK_PackagingVariantDetailID=AV.ID AND C.ID=VD.FK_ColourID AND IM.FKItemType=it.ID AND OD.Sales_Unit_ID=U.ID`
      }
    };

    const searchPattern = `%${String(search).trim()}%`;

    let baseQuery = '';
    let countQuery = '';

    if (category === 'Finish Product') {
      // Base SQL query with proper UNION structure (Finish Product only)
      baseQuery = `
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

      const searchClause = search
        ? ` WHERE ([Order #] LIKE @searchPattern OR [Item Code] LIKE @searchPattern)`
        : '';
      const countSearchClause = search
        ? ` AND (OM.OrderNo LIKE @searchPattern OR (IM.ItemCode+'-'+M.M_Code+'-'+C.Code+'-'+F.Code) LIKE @searchPattern)`
        : '';

      baseQuery += searchClause;

      // Get total count for pagination (including both UNION parts)
      countQuery = `
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
        AND V.ID=@vendorId${countSearchClause}
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
        AND V.ID=@vendorId${countSearchClause}
        AND (OD.OrderQty - OD.RcvdQty - OD.AutoClosedPenaltyQty) = 0
        AND OD.InQCQty > 0
        AND OD.Sales_Unit_ID=U.ID 
        AND OD.Status NOT LIKE 'Force Closed' 
        AND OD.Status NOT LIKE 'Auto Closed' 
        AND OM.OrderStat!='Draft' 
        AND C3.FK_Category2ID=C2.ID 
        AND IM.FKSubGroupID=C3.ID)
      ) AS CountUnion`;
    } else if (categoryConfig[category]) {
      // Non-Finish-Product categories: same full pending column set on their own order tables
      const cfg = categoryConfig[category];
      const baseSelect = `SELECT ${cfg.categoryLiteral} as Category,
        it.ImageFolderPathOnline as Imagepath,
        OM.OrderNo as 'Order #',
        CAST(OM.OrderDate as Date) as Date,
        ${cfg.itemCodeExpr} as 'Item Code',
        AV.OldCode as 'Old Code',
        ${cfg.descriptionExpr} as 'Description',
        AV.factoryCode as 'Factory Code',
        V.CompanyName as Vendor,
        OD.OrderQty as [Order],
        ((OD.OrderQty-OD.InQCQty-(OD.OrderQty - OD.RcvdQty))) as Received,
        OD.InQCQty as QC,
        OD.RejectQty as Reject,
        (OD.OrderQty - OD.RcvdQty) as Pending,
        U.UnitName as Unit,
        ${cfg.stockExpr} as Stock,
        NULL as 'Delivery Date',
        NULL as 'DDate',
        NULL as 'FDDate',
        NULL as 'ClosingDays',
        '' as 'PR Status',
        (CASE WHEN ISNULL(TRY_CAST(OD.FOBPrice AS money), 0) > 0 THEN 'Y' ELSE 'N' END) as isCost,
        ISNULL(IM.Picture, '') as Picture,
        ISNULL(VD.Picture, '') as VPicture,
        CAST((ISNULL(TRY_CAST(OD.FOBPrice AS decimal(18,4)), 0) * ISNULL(TRY_CAST(OD.ExRate AS decimal(18,4)), 1)) * CAST((OD.OrderQty - OD.RcvdQty) as int) as money) as Price,
        OD.RcvdQty as LastReceive,
        CAST(AV.LastRecDate as date) as L_Receive,
        CAST(NULL as int) as AutoClosedPenaltyQty`;

      const pendingExpr = '(OD.OrderQty - OD.RcvdQty)';
      const fromWhere = `${cfg.fromClause} ${cfg.whereClause} AND OM.OrderStat!='Draft' AND OD.Status NOT LIKE 'Force Closed' AND OD.Status NOT LIKE 'Auto Closed' AND V.ID=@vendorId AND (${pendingExpr} > 0 OR (${pendingExpr} = 0 AND OD.InQCQty > 0))`;

      const searchClause = search
        ? ` AND (OM.OrderNo LIKE @searchPattern OR ${cfg.itemCodeExpr} LIKE @searchPattern)`
        : '';

      baseQuery = `${baseSelect} ${fromWhere}${searchClause}`;
      countQuery = `SELECT COUNT(*) as total ${fromWhere}${searchClause}`;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }

    // Add sorting and pagination
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

    // Execute both queries
    const [result, countResult] = await Promise.all([
      database.query(baseQuery, { vendorId: parseInt(vendorId), searchPattern }),
      database.query(countQuery, { vendorId: parseInt(vendorId), searchPattern })
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
        sortOrder,
        category
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