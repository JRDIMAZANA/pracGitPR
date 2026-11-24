import * as cashierServices from "../services/cashierServices.js";

export const fetchAllMenu = async (req, res) => {
    try {
        const menu = await cashierServices.fetchAllMenu();
        res.status(200).json(menu);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch menu",
            error: error.message
        });
    }
};

export const fetchMenuItemById = async (req, res) => {
    const { id } = req.params;
    try {
        const menuItem = await cashierServices.fetchMenuItemById(id);
        if (menuItem.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        res.status(200).json(menuItem[0]);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch menu item",
            error: error.message
        });
    }
}

export const fetchCart = async (req, res) => {
    try {
        const cart = await cashierServices.fetchCart();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch cart",
            error: error.message
        });
    }
};

export const addProductToCart = async (req, res) => {
    const { id, quantity, unit_price } = req.body;
    const cashier = { id, quantity, unit_price };
    try {
        const result = await cashierServices.addProductToCart(cashier);
        res.status(201).json({
             message: "Product added to cart", result });
    } catch (e) {
        res.status(500).json({
            message: "Failed to add product to cart",
            error: e.message
        });
    }
};

export const updateCartItem = async (req, res) => {
    const { id, quantity } = req.body;
    const cashier = { id, quantity };
    try {
        const result = await cashierServices.updateCartItem(cashier);
        res.status(200).json({
            message: "Cart item updated", result });
    } catch (e) {
        res.status(500).json({
            message: "Failed to update cart item",
            error: e.message
        });
    }
};