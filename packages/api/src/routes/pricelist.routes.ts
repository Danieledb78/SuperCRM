import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as pricelistController from '../controllers/pricelist.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// PRICE LISTS
// ============================================

// Get all price lists
router.get('/', pricelistController.getPriceLists);

// Get price lists summary
router.get('/summary', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CFO', 'PURCHASING_DIRECTOR']), pricelistController.getPriceListsSummary);

// Search across all price lists
router.get('/search', pricelistController.searchAllPriceLists);

// Compare prices across suppliers
router.get('/compare', pricelistController.comparePrices);

// Get single price list
router.get('/:id', pricelistController.getPriceList);

// Create price list
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'PURCHASING_DIRECTOR', 'WAREHOUSE_MANAGER']), pricelistController.createPriceList);

// Update price list
router.put('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'PURCHASING_DIRECTOR', 'WAREHOUSE_MANAGER']), pricelistController.updatePriceList);

// Delete price list
router.delete('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'PURCHASING_DIRECTOR']), pricelistController.deletePriceList);

// Get price list statistics
router.get('/:id/stats', pricelistController.getPriceListStats);

// ============================================
// SYNC & IMPORT
// ============================================

// Sync price list from API
router.post('/:id/sync', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'PURCHASING_DIRECTOR', 'WAREHOUSE_MANAGER']), pricelistController.syncPriceList);

// Import from file
router.post('/:id/import', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'PURCHASING_DIRECTOR', 'WAREHOUSE_MANAGER']), pricelistController.importFromFile);

// Preview import
router.post('/:id/import/preview', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'PURCHASING_DIRECTOR', 'WAREHOUSE_MANAGER']), pricelistController.previewImport);

// Get sync history
router.get('/:id/sync-history', pricelistController.getSyncHistory);

// ============================================
// PRICE LIST ITEMS
// ============================================

// Get items in price list
router.get('/:id/items', pricelistController.getPriceListItems);

// Get single item
router.get('/:id/items/:itemId', pricelistController.getPriceListItem);

// Get price history for item
router.get('/:id/items/:itemId/history', pricelistController.getPriceHistory);

// ============================================
// PRODUCT MATCHING
// ============================================

// Link item to internal product
router.post('/:id/items/:itemId/link', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'PURCHASING_DIRECTOR', 'WAREHOUSE_MANAGER']), pricelistController.linkToProduct);

// Unlink from product
router.delete('/:id/items/:itemId/link', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'PURCHASING_DIRECTOR', 'WAREHOUSE_MANAGER']), pricelistController.unlinkFromProduct);

// Auto-match products
router.post('/:id/auto-match', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'PURCHASING_DIRECTOR', 'WAREHOUSE_MANAGER']), pricelistController.autoMatchProducts);

// ============================================
// CATEGORIES & BRANDS
// ============================================

// Get categories
router.get('/:id/categories', pricelistController.getCategories);

// Get brands
router.get('/:id/brands', pricelistController.getBrands);

export default router;
