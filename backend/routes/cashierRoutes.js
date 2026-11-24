import * as cashierController from "../controllers/cashierController.js";
import express from 'express';

const cashierRoutes = express.Router();

cashierRoutes.get('/all', cashierController.fetchAllMenu);
cashierRoutes.get('/cart', cashierController.fetchCart);
cashierRoutes.get('/:id', cashierController.fetchMenuItemById);
cashierRoutes.post('/cart', cashierController.addProductToCart);
cashierRoutes.put('/cart', cashierController.updateCartItem);

export default cashierRoutes;