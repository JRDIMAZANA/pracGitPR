import * as cashierModel from '../models/cashierModel.js';
import ValidationError from '../utils/ValidationError.js';

export const fetchAllMenu = async (search = "") => {
    const term = String(search ?? "").trim();
    if (term.length > 100) {
        throw new ValidationError(400, "Search text must be 100 characters or fewer");
    }
    return await cashierModel.cashierMenu(term);
};

export const fetchMenuItemById = async (id) => {
    const rows = await cashierModel.cashierProductById(id);
    if (rows.length === 0) throw new ValidationError(404, "Menu item not found");
    return rows[0];
};

// Returns the cart items plus the item count, subtotal and total
export const fetchCart = async () => {
    const rows = await cashierModel.cartItems();

    const items = rows
        .map((row) => {
            const price = Number(row.price);
            const quantity = Number(row.quantity);
            return {
                product_id: row.product_id,
                product: row.product,
                price,
                image: row.image,
                quantity,
                // calculated here, so no line_total column or query alias is needed
                line_total: (Math.round(price * 100) * quantity) / 100,
            };
        })
        .filter((item) => item.quantity > 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Add in cents to avoid floating-point drift (0.1 + 0.2 problems)
    const subtotalCents = items.reduce(
        (sum, item) => sum + Math.round(item.line_total * 100),
        0
    );
    const subtotal = subtotalCents / 100;

    // No tax or discount rules yet, so total equals subtotal
    return { items, itemCount, subtotal, total: subtotal };
};

export const addProductToCart = async ({ id, quantity }) => {
    id = Number(id);
    quantity = Number(quantity);

    if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 1) {
        throw new ValidationError(400, "A product id and a whole quantity of 1 or more are required");
    }

    const result = await cashierModel.addToCart({ id, quantity });
    if (result.affectedRows === 0) throw new ValidationError(404, "Menu item not found");
    return result;
};

export const updateCartItem = async ({ id, quantity }) => {
    id = Number(id);
    quantity = Number(quantity);

    if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 0) {
        throw new ValidationError(400, "A product id and a quantity of 0 or more are required");
    }

    const result = await cashierModel.updateCartItem({ id, quantity });
    if (result.affectedRows === 0) throw new ValidationError(404, "Cart item not found");
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