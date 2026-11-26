import * as cashierModel from '../models/cashierModel.js';
import ValidationError from '../utils/ValidationError.js';

export const fetchAllMenu = async () => {
    return await cashierModel.cashierMenu();
};

export const fetchMenuItemById = async (id) => {
    const rows = await cashierModel.cashierProductById(id);
    if (rows.length === 0) throw new ValidationError(404, "Menu item not found");
    return rows[0];
};

export const fetchCart = async () => {
    return await cashierModel.cartItems();
};

export const addProductToCart = async ({ id, quantity }) => {
    id = Number(id);
    quantity = Number(quantity);

    if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 1) {
        throw new ValidationError(400, "A product id and a whole quantity of 1 or more are required");
    }

    const result = await cashierModel.addToCart({ id, quantity });
    if (result.affectedRows === 0) {
        throw new ValidationError(404, "Menu item not found");
    }
    return result;
};

export const updateCartItem = async ({ id, quantity }) => {
    id = Number(id);
    quantity = Number(quantity);

    if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 0) {
        throw new ValidationError(400, "A product id and a quantity of 0 or more are required");
    }

    const result = await cashierModel.updateCartItem({ id, quantity });
    if (result.affectedRows === 0) {
        throw new ValidationError(404, "Cart item not found");
    }
    return result;
};

export const removeCartItem = async (id) => {
    id = Number(id);
    if (!Number.isInteger(id)) {
        throw new ValidationError(400, "A valid product id is required");
    }

    const result = await cashierModel.removeCartItem(id);
    if (result.affectedRows === 0) throw new ValidationError(404, "Cart item not found");
    return result;
};