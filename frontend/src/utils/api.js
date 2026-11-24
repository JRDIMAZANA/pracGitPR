const cashier = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${cashier}${path}`, {
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

export function fetchMenu() {
  return request("/cashier/all");
}

export function fetchCart() {
  return request("/cashier/cart");
}

export function addToCart(id, quantity = 1) {
  return request("/cashier/cart", {
    method: "POST",
    body: JSON.stringify({ id, quantity }),
  });
}
