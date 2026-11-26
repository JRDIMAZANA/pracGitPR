import { useCallback, useEffect, useRef, useState } from "react";

// ---------- Backend calls ----------
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body && body.message) message = body.message;
    } catch {
      // Keep the status message if the error body is not JSON.
    }
    throw new Error(message);
  }

  return response.json();
}

function fetchMenu(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return request(`/cashier/all${query}`);
}

function fetchCart() {
  return request("/cashier/cart");
}

function postCartItem(id, quantity = 1) {
  return request("/cashier/cart", {
    method: "POST",
    body: JSON.stringify({ id, quantity }),
  });
}

function putCartItem(id, quantity) {
  return request("/cashier/cart", {
    method: "PUT",
    body: JSON.stringify({ id, quantity }),
  });
}

function deleteCartItem(id) {
  return request(`/cashier/cart/${id}`, { method: "DELETE" });
}

// ---------- Helpers ----------
function imageUrl(image) {
  if (!image) return "/food.jpg";
  if (/^https?:\/\//.test(image) || image.charAt(0) === "/") return image;
  return `/${image}`;
}

function peso(amount) {
  return `₱${Number(amount || 0).toFixed(2)}`;
}

const EMPTY_CART = { items: [], itemCount: 0, subtotal: 0, total: 0 };

function toMenuItems(data) {
  const rows = Array.isArray(data) ? data : data.menu || data.items || [];
  return rows.map((item) => ({
    product_id: item.product_id,
    product: item.product,
    price: item.price,
    image: item.image,
  }));
}

// Accepts both cart formats: the new { items, itemCount, subtotal, total }
// object and the old plain array, so the page works with either backend.
function toCart(data) {
  const rows = Array.isArray(data) ? data : data.items || data.cart || [];

  const items = rows
    .map((item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      return {
        ...item,
        price,
        quantity,
        line_total:
          item.line_total !== undefined
            ? Number(item.line_total)
            : price * quantity,
      };
    })
    .filter((item) => item.quantity > 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal =
    items.reduce((sum, item) => sum + Math.round(item.line_total * 100), 0) /
    100;

  const fromBackend = !Array.isArray(data);
  return {
    items,
    itemCount:
      fromBackend && data.itemCount != null ? data.itemCount : itemCount,
    subtotal: fromBackend && data.subtotal != null ? data.subtotal : subtotal,
    total: fromBackend && data.total != null ? data.total : subtotal,
  };
}

function OrderingSystem() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState(EMPTY_CART);
  const [cartLoading, setCartLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const menuRequest = useRef(0);

  // Load the menu, optionally filtered. Late responses from older
  // searches are ignored so results never show out of order.
  const loadMenu = useCallback(async (search = "") => {
    const requestId = ++menuRequest.current;
    setLoading(true);
    setError("");
    try {
      const data = await fetchMenu(search);
      if (requestId !== menuRequest.current) return;
      setItems(toMenuItems(data));
      setAppliedSearch(search);
    } catch (err) {
      if (requestId === menuRequest.current)
        setError(err.message || "Could not load the menu.");
    } finally {
      if (requestId === menuRequest.current) setLoading(false);
    }
  }, []);

  const loadCart = useCallback(async () => {
    setCartLoading(true);
    setCartError("");
    try {
      const data = await fetchCart();
      setCart(toCart(data));
    } catch (err) {
      setCartError(err.message || "Could not load the cart.");
    } finally {
      setCartLoading(false);
    }
  }, []);

  // First load. State is only set inside the promise callbacks (never
  // synchronously in the effect body), which keeps React's lint rule happy.
  useEffect(() => {
    let active = true;

    fetchMenu()
      .then((data) => {
        // ignore this result if the person already searched
        if (active && menuRequest.current === 0) setItems(toMenuItems(data));
      })
      .catch((err) => {
        if (active && menuRequest.current === 0)
          setError(err.message || "Could not load the menu.");
      })
      .finally(() => {
        if (active && menuRequest.current === 0) setLoading(false);
      });

    fetchCart()
      .then((data) => {
        if (active) setCart(toCart(data));
      })
      .catch((err) => {
        if (active) setCartError(err.message || "Could not load the cart.");
      });

    return () => {
      active = false;
    };
  }, []);

  // Runs a cart request, then refreshes the cart from the backend
  async function runCartAction(action, failMessage) {
    if (isBusy) return;
    setIsBusy(true);
    setCartError("");
    try {
      await action();
      await loadCart();
    } catch (err) {
      setCartError(err.message || failMessage);
    } finally {
      setIsBusy(false);
    }
  }

  const handleAddToCart = (id) =>
    runCartAction(() => postCartItem(id, 1), "Could not add item to cart.");

  const handleChangeQuantity = (id, quantity) =>
    runCartAction(
      () => putCartItem(id, Math.max(0, quantity)),
      "Could not update the cart.",
    );

  const handleRemove = (id) =>
    runCartAction(() => deleteCartItem(id), "Could not remove the item.");

  function handleSearch(event) {
    event.preventDefault();
    loadMenu(searchTerm.trim());
  }

  function handleSearchChange(event) {
    const value = event.target.value;
    setSearchTerm(value);
    // Clearing the box (including the browser's × button) shows every meal again
    if (value === "" && appliedSearch !== "") loadMenu("");
  }

  const quantities = Object.fromEntries(
    cart.items.map((item) => [item.product_id, Number(item.quantity)]),
  );

  return (
    <>
      <header>
        <p>Sinalab Garden</p>
        <h1>Order Management</h1>
      </header>

      <nav>
        <form className="nav-search" role="search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search meals..."
            aria-label="Search menu"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button type="submit">Find</button>
        </form>
        <div>
          <button
            type="button"
            className="cart-trigger"
            aria-label={`Open cart, ${cart.itemCount} items`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
            </svg>
            {cart.itemCount > 0 && (
              <span className="cart-badge">{cart.itemCount}</span>
            )}
          </button>
          {isOpen && (
            <div className="cart-overlay open">
              <div className="cart-container">
                <div className="cart-header">
                  <h3>Your Cart</h3>
                  <button
                    id="closeCartBtn"
                    className="close-btn"
                    aria-label="Close cart"
                    onClick={() => setIsOpen(false)}
                  >
                    &times;
                  </button>
                </div>

                <div className="cart-items">
                  {cartError && (
                    <p className="cart-status cart-status--error">
                      {cartError}
                    </p>
                  )}
                  {cartLoading && cart.items.length === 0 && (
                    <p className="cart-status">Loading cart...</p>
                  )}
                  {!cartLoading && cart.items.length === 0 && (
                    <p className="cart-status">Your cart is empty.</p>
                  )}
                  {cart.items.map((item) => (
                    <div className="cart-row" key={item.product_id}>
                      <div className="cart-row-info">
                        <p className="cart-row-name">{item.product}</p>
                        <p className="cart-row-price">
                          {peso(item.price)} each &middot;{" "}
                          {peso(item.line_total)}
                        </p>
                        <button
                          type="button"
                          className="remove-btn"
                          disabled={isBusy}
                          onClick={() => handleRemove(item.product_id)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="qty-controls">
                        <button
                          type="button"
                          aria-label={`Remove one ${item.product}`}
                          disabled={isBusy}
                          onClick={() =>
                            handleChangeQuantity(
                              item.product_id,
                              item.quantity - 1,
                            )
                          }
                        >
                          &minus;
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Add one ${item.product}`}
                          disabled={isBusy}
                          onClick={() =>
                            handleChangeQuantity(
                              item.product_id,
                              item.quantity + 1,
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="checkout-ctn">
                  <p className="cart-summary-row">
                    <span>
                      Subtotal ({cart.itemCount}{" "}
                      {cart.itemCount === 1 ? "item" : "items"})
                    </span>
                    <span>{peso(cart.subtotal)}</span>
                  </p>
                  <p className="cart-total">
                    <span>Total</span>
                    <span>{peso(cart.total)}</span>
                  </p>
                  <button
                    className="checkout-btn"
                    disabled={cart.items.length === 0}
                  >
                    Verify Order
                  </button>
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
        {cartError && !isOpen && (
          <p className="menu-status menu-status--error">{cartError}</p>
        )}
        {!loading && !error && (
          <div className="menu-items">
            {items.length === 0 && (
              <p className="menu-status">
                {appliedSearch
                  ? `No meals match "${appliedSearch}". Try a different word.`
                  : "No menu items available."}
              </p>
            )}

            {items.map((item) => {
              const quantity = quantities[item.product_id] || 0;
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
                      <p className="card-price">{peso(item.price)}</p>
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
