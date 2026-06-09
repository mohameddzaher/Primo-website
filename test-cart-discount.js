const http = require("http");

const BASE = "localhost";
const PORT = 5001;

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE,
      port: PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on("error", (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  // ---- Step 1: Login ----
  console.log("=== Step 1: Login as user@primo.com ===\n");

  let loginRes;
  try {
    loginRes = await request("POST", "/api/v1/auth/login", {
      email: "user@primo.com",
      password: "user123",
    });
  } catch (err) {
    console.error("ERROR: Could not connect to localhost:5001 -", err.message);
    process.exit(1);
  }

  console.log("Login status:", loginRes.status);
  console.log("Login response:", JSON.stringify(loginRes.body, null, 2));

  const token = loginRes.body?.data?.accessToken;
  if (!token) {
    console.error("\nERROR: No accessToken found at data.accessToken in login response. Aborting.");
    process.exit(1);
  }
  console.log("\nToken obtained:", token.slice(0, 30) + "...\n");

  // ---- Step 2: GET /api/v1/cart ----
  console.log("=== Step 2: GET /api/v1/cart ===\n");

  const cartRes = await request("GET", "/api/v1/cart", null, {
    Authorization: "Bearer " + token,
  });

  console.log("Cart status:", cartRes.status);
  console.log("Full cart response:", JSON.stringify(cartRes.body, null, 2));

  // ---- Step 3: Check for discount fields on products ----
  console.log("\n=== Step 3: Check product-level discount fields ===\n");

  const cartData = cartRes.body?.data || cartRes.body;
  const items = cartData?.items || cartData?.products || cartData?.cartItems || [];

  if (!Array.isArray(items) || items.length === 0) {
    console.log("No items found in cart (or unexpected structure). Nothing to inspect.");
  } else {
    console.log("Found " + items.length + " item(s) in cart.\n");

    let anyDiscount = false;
    items.forEach((item, i) => {
      const name = item.name || item.productName || item.title || ("Item " + (i + 1));
      const discount = item.discount !== undefined ? item.discount
        : item.discountPercent !== undefined ? item.discountPercent
        : item.discountAmount !== undefined ? item.discountAmount
        : undefined;

      if (discount !== undefined) {
        anyDiscount = true;
        console.log("  [" + (i + 1) + '] "' + name + '" - discount: ' + JSON.stringify(discount));
      } else {
        console.log("  [" + (i + 1) + '] "' + name + '" - no discount field');
      }
    });

    console.log(
      anyDiscount
        ? "\nSome products have a discount field."
        : "\nNo products have a discount field."
    );
  }

  // Print top-level subtotal / discount if present
  console.log("\n=== Cart-level summary ===");
  const subtotal = cartData?.subtotal !== undefined ? cartData.subtotal
    : cartData?.subTotal !== undefined ? cartData.subTotal : "N/A";
  const discount = cartData?.discount !== undefined ? cartData.discount
    : cartData?.totalDiscount !== undefined ? cartData.totalDiscount : "N/A";
  const total = cartData?.total !== undefined ? cartData.total
    : cartData?.totalPrice !== undefined ? cartData.totalPrice : "N/A";
  console.log("  Subtotal : " + subtotal);
  console.log("  Discount : " + discount);
  console.log("  Total    : " + total);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
