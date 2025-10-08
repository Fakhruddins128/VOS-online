const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get Purchase Order Draft data based on category
router.get('/', async (req, res) => {
  try {
    const { category = 'Material', vendorId } = req.query;
    
    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    let query = '';
    console.log('category', category);
    switch (category) {
      case 'Material':
        query = `SELECT V.CompanyName as Vendor, OM.OrderNo, OM.OrderDate, 
                 (IM.ItemCode+'-'+C.Code+'-'+G.Code) as ItemCode, AV.OldCode, 
                 IM.ProductName as 'Description', OD.OrderQty as 'ReserveQty' 
                 FROM ItemMaster IM, MaterialVariantDetail VD, FP_ColorMaster C, 
                 Grade G, ApprovedVendorMaterial AV, Vendor V, MaterialOrderMaster OM, 
                 MaterialOrderDetail OD 
                 WHERE VD.FK_ItemMasterID=IM.ID AND C.ID=VD.FKColourID AND G.ID=VD.FKGradeID 
                 AND AV.FK_VendorID=V.ID AND AV.FK_MaterialVariantDetail=VD.ID 
                 AND OD.FK_MaterialOrderMasterID=OM.ID AND OD.FK_MaterialVariantDetailID=AV.ID 
                 AND OM.OrderStat='Draft' AND OM.FK_VendorID=V.ID AND OM.FK_VendorID=@vendorId 
                 ORDER BY OM.OrderNo DESC`;
        break;
        
      case 'Preps':
        query = `SELECT V.CompanyName as Vendor, OM.OrderNo, OM.OrderDate, 
                 (IM.ItemCode+'-'+F.Code) as ItemCode, AV.OldCode, 
                 IM.ProductName as 'Description', OD.OrderQty as 'ReserveQty' 
                 FROM ItemMaster IM, PrepVariantDetail VD, Finish F, 
                 ApprovedVendorPrep AV, Vendor V, PrepOrderMaster OM, PrepOrderDetail OD 
                 WHERE VD.FK_ItemMasterID=IM.ID AND AV.FK_VendorID=V.ID 
                 AND AV.FK_PrepVariantDetail=VD.ID AND OD.FK_PrepOrderMasterID=OM.ID 
                 AND OD.FK_PrepVariantDetailID=AV.ID AND F.ID=VD.FK_FinishID 
                 AND OM.OrderStat='Draft' AND OM.FK_VendorID=V.ID AND OM.FK_VendorID=@vendorId 
                 ORDER BY OM.OrderNo DESC`;
        break;
        
      case 'Accessories':
        query = `SELECT V.CompanyName as Vendor, OM.OrderNo, OM.OrderDate, 
                 (IM.ItemCode+'-'+C.Code) as ItemCode, AV.OldCode, 
                 IM.ProductName as 'Description', OD.OrderQty as 'ReserveQty' 
                 FROM ItemMaster IM, AccessoryVariantDetail VD, FP_ColorMaster C, 
                 ApprovedVendorAccessory AV, Vendor V, AccessoryOrderMaster OM, AccessoryOrderDetail OD 
                 WHERE VD.FK_ItemMasterID=IM.ID AND AV.FK_VendorID=V.ID 
                 AND AV.FK_AccessoryVariantDetail=VD.ID AND OD.FK_AccessoryOrderMasterID=OM.ID 
                 AND OD.FK_AccessoryVariantDetailID=AV.ID AND OM.OrderStat='Draft' 
                 AND C.ID=VD.FK_ColourID AND OM.FK_VendorID=V.ID AND OM.FK_VendorID=@vendorId 
                 ORDER BY OM.OrderNo DESC`;
        break;
        
      case 'Packaging':
        query = `SELECT V.CompanyName as Vendor, OM.OrderNo, OM.OrderDate, 
                 (IM.ItemCode+'-'+C.Code) as ItemCode, AV.OldCode, 
                 IM.ProductName as 'Description', OD.OrderQty as 'ReserveQty' 
                 FROM ItemMaster IM, PackagingVariantDetail VD, FP_ColorMaster C, 
                 ApprovedVendorPackaging AV, Vendor V, PackagingOrderMaster OM, PackagingOrderDetail OD 
                 WHERE VD.FK_ItemMasterID=IM.ID AND AV.FK_VendorID=V.ID 
                 AND AV.FK_PackagingVariantDetail=VD.ID AND OD.FK_PackagingOrderMasterID=OM.ID 
                 AND OD.FK_PackagingVariantDetailID=AV.ID AND OM.OrderStat='Draft' 
                 AND C.ID=VD.FK_ColourID AND OM.FK_VendorID=V.ID AND OM.FK_VendorID=@vendorId 
                 ORDER BY OM.OrderNo DESC`;
        break;
        
      case 'Finish Product':
        query = `SELECT 
                 C2.Description as Category, 
                 V.CompanyName as Vendor, 
                 OM.OrderNo, 
                 OM.OrderDate, 
                 (IM.ItemCode+'-'+M.M_Code+'-'+C.Code+'-'+F.Code) as ItemCode, 
				 IM.Picture,
				 it.ImageFolderPathOnline  as Imagepath,
                 AV.OldCode, 
                 (IM.ProductName+'/ '+M.ProductName+'/ '+C.Color+'/ '+F.Finish) as 'Description', 
                 OD.OrderQty as 'ReserveQty'
                 FROM 
                 ItemMaster IM, 
                 FinishProductVariantDetail VD, 
                 FP_MaterialMaster M, 
                 FP_ColorMaster C, 
                 Finish F, 
                 ApprovedVendorFinishProduct AV, 
                 Vendor V, 
                 FinishProductOrderMaster OM, 
                 FinishProductOrderDetail OD, 
                 Category2 C2, 
                 Category3 C3,
				          ItemType IT
                 WHERE 
                 VD.FK_ItemMasterID=IM.ID 
                 AND C.ID=VD.FKColourID 
                 AND F.ID=VD.FKFinishID 
                 AND M.ID = VD.FKMaterialID 
                 AND AV.FK_VendorID=V.ID 
                 AND AV.FK_FinishProductVariantDetail=VD.ID 
                 AND OD.FK_FinishProductOrderMasterID=OM.ID 
                 AND OD.FK_FinishProductApprovedVariantID=AV.ID 
                 AND IM.FKSubGroupID=C3.ID 
                 AND C3.FK_Category2ID=C2.ID 
                 AND OM.OrderStat='Draft' 
                 AND OM.FK_VendorID=V.ID AND OM.FK_VendorID=@vendorId
				          AND IM.FKItemType=IT.ID
                 ORDER BY OM.OrderNo DESC`;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid category' });
    }

    const result = await db.query(query, { vendorId });

 

    res.json({
      success: true,
      data: result.recordset || result,
      category: category,
      count: (result.recordset || result).length
    });
    
  } catch (error) {
    console.error('Error fetching purchase order draft data:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

module.exports = router;