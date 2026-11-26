import * as cashierServices from "../services/cashierServices.js";
import ValidationError from "../utils/ValidationError.js";

export const fetchAllMenu = async (req, res) => {
    try {
        const menu = await cashierServices.fetchAllMenu();
        res.status(200).json(menu);
    } catch (error) {
        ValidationError(400, "Failed to fetch menu");
    }
};

export const fetchMenuItemById = async (req, res) => {
    try {
        const item = await cashierServices.fetchMenuItemById(req.params.id);
        res.status(200).json(item);
    } catch (error) {
        ValidationError(400, "Failed to fetch menu item");
    }
};

export const fetchCart = async (req, res) => {
    try {
        const cart = await cashierServices.fetchCart();
        res.status(200).json(cart);
    } catch (error) {
        ValidationError(400, "Failed to fetch cart");
    }
};

export const addProductToCart = async (req, res) => {
    try {
        await cashierServices.addProductToCart(req.body);
        res.status(201).json({ message: "Product added to cart" });
    } catch (error) {
        ValidationError(400, "Failed to add product to cart");
    }
};

export const updateCartItem = async (req, res) => {
    try {
        await cashierServices.updateCartItem(req.body);
        res.status(200).json({ message: "Cart item updated" });
    } catch (error) {
        ValidationError(400, "Failed to update cart item");
    }
};

export const removeCartItem = async (req, res) => {
    try {
        await cashierServices.removeCartItem(req.params.id);
        res.status(200).json({ message: "Cart item removed" });
    } catch (error) {
        ValidationError(400, "Failed to remove cart item");
    }
};
