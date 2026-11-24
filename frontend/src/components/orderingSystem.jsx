import { useCallback, useEffect, useState } from "react";
import {
  fetchMenu,
  fetchCart,
  addToCart as postCartItem,
} from "../utils/api.js";

function imageUrl(image) {
  if (!image) return "/food.jpg";
  if (/^https?:\/\//.test(image) || image.charAt(0) === "/") return image;
  return `/${image}`;
}

function OrderingSystem() {
  const [items, setItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    let active = true;

    fetchMenu()
      .then((data) => {
        const rows = Array.isArray(data) ? data : data.menu || data.items || [];
        if (active)
          setItems(
            rows.map((item) => ({
              product_id: item.product_id,
              product: item.product,
              price: item.price,
              image: item.image,
            })),
          );
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load the menu.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadCart = useCallback(async () => {
    setCartLoading(true);
    setCartError("");
    try {
      const rows = await fetchCart();
      setCartItems(Array.isArray(rows) ? rows : (rows && rows.cart) || []);
    } catch (err) {
      setCartError(err.message || "Could not load the cart.");
    } finally {
      setCartLoading(false);
    }
  }, []);

  async function handleAddToCart(id) {
    if (isAdding) return;
    setIsAdding(true);
    setCartError("");
    try {
      await postCartItem(id, 1);
      await loadCart();
    } catch (err) {
      setCartError(err.message || "Could not add item to cart.");
    } finally {
      setIsAdding(false);
    }
  }

  const cart = Object.fromEntries(
    cartItems.map((item) => [item.product_id, Number(item.quantity)]),
  );
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  return (
    <>
      <header>
        <p>Sinalab Garden</p>
        <h1>Order Management</h1>
      </header>

      <nav>
        <div>
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search menu"
          />
          <button type="button">Find</button>
        </div>
        <div>
          <a className="clickable" onClick={() => setIsOpen(!isOpen)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
            </svg>
          </a>
          {isOpen && (
            <div className="cart-overlay open">
              <div className="cart-container">
                <div className="cart-header">
                  <h3>Your Cart</h3>
                  <button
                    id="closeCartBtn"
                    className="close-btn"
                    onClick={() => setIsOpen(false)}
                  >
                    &times;
                  </button>
                </div>

                <div className="cart-items">
                  {cartLoading && (
                    <p className="cart-status">Loading cart...</p>
                  )}
                  {!cartLoading && cartItems.length === 0 && (
                    <p className="cart-status">Your cart is empty.</p>
                  )}
                  {!cartLoading &&
                    cartItems.map((item) => (
                      <p key={item.product_id}>
                        {item.product} (x{item.quantity}) - ₱
                        {(Number(item.price) * Number(item.quantity)).toFixed(
                          2,
                        )}
                      </p>
                    ))}
                </div>
                <div className="checkout-ctn">
                  <p className="cart-total">Total: ₱{cartTotal.toFixed(2)}</p>
                  <button className="checkout-btn">Verify Order</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <section id="category">
        <h1>Meals</h1>
        {loading && <p className="menu-status">Loading menu...</p>}
        {error && <p className="menu-status menu-status--error">{error}</p>}
        {cartError && (
          <p className="menu-status menu-status--error">{cartError}</p>
        )}
        {!loading && !error && (
          <div className="menu-items">
            {items.length === 0 && (
              <p className="menu-status">No menu items available.</p>
            )}

            {items.map((item) => {
              const quantity = cart[item.product_id] || 0;
              return (
                <article
                  key={item.product_id}
                  className={quantity > 0 ? "card card--added" : "card"}
                >
                  <a
                    href="#category"
                    className="tappable-card"
                    onClick={(event) => {
                      event.preventDefault();
                      handleAddToCart(item.product_id);
                    }}
                  >
                    <span className="card-body">
                      <img src={imageUrl(item.image)} alt={item.product} />
                      <h3>{item.product}</h3>
                      <p className="card-price">
                        ₱{Number(item.price).toFixed(2)}
                      </p>
                      <p className="card-hint">
                        {quantity > 0 ? `In cart: ${quantity}` : "Tap to add"}
                      </p>
                    </span>
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export default OrderingSystem;
