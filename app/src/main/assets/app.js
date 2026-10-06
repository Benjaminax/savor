// Savor Mobile App Controller

const screens = [
  "welcome",
  "auth",
  "home",
  "details",
  "reserve",
  "success",
  "empty",
  "error",
  "loading",
  "soldout"
];

let currentQuantity = 1;
const basePrice = 5.00;
const serviceFee = 0.50;

// Update Live Time in Phone Status Bar
function updateLiveTime() {
  const timeElem = document.getElementById("live-time");
  if (!timeElem) return;
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  timeElem.textContent = `${hours}:${minutes}`;
}
setInterval(updateLiveTime, 30000);
updateLiveTime();

// Show Screen Helper
function showScreen(name) {
  if (!screens.includes(name)) return;

  screens.forEach((screenId) => {
    const elem = document.getElementById(`screen-${screenId}`);
    if (elem) {
      elem.classList.toggle("active", screenId === name);
    }
  });

  // Sync Demo Bar Buttons
  document.querySelectorAll(".demo-btn").forEach((btn) => {
    const target = btn.dataset.go;
    btn.classList.toggle("active", target === name);
  });

  // Reset scroll position on active screen
  const activeScreen = document.getElementById(`screen-${name}`);
  if (activeScreen) {
    const scrollable = activeScreen.querySelector(".home-scroll, .detail-scroll, .reserve-scroll");
    if (scrollable) scrollable.scrollTop = 0;
  }
}

// Toast Helper
function showToast(message) {
  const toastNode = document.getElementById("toast");
  if (!toastNode) return;
  toastNode.textContent = message;
  toastNode.classList.add("show");
  window.clearTimeout(window.toastTimer);
  window.toastTimer = window.setTimeout(() => {
    toastNode.classList.remove("show");
  }, 2400);
}

// Event Listeners Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Navigation triggers via [data-go]
  document.body.addEventListener("click", (e) => {
    const targetGo = e.target.closest("[data-go]");
    if (targetGo) {
      const screenName = targetGo.dataset.go;
      showScreen(screenName);
    }

    const targetState = e.target.closest("[data-state]");
    if (targetState) {
      const stateName = targetState.dataset.state;
      if (stateName === "loading") {
        showScreen("loading");
        window.setTimeout(() => {
          showScreen("home");
          showToast("Connection restored! Rescues loaded.");
        }, 1200);
      } else {
        showScreen(stateName);
      }
    }
  });

  // Password Visibility Toggle
  const togglePassBtn = document.getElementById("toggle-password");
  const passInput = document.getElementById("password");
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener("click", () => {
      const isPass = passInput.type === "password";
      passInput.type = isPass ? "text" : "password";
      togglePassBtn.textContent = isPass ? "🙈" : "👁";
      showToast(isPass ? "Password visible" : "Password hidden");
    });
  }

  // Category Selector
  const categoryButtons = document.querySelectorAll(".category");
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat || btn.textContent.toLowerCase();

      if (cat === "produce") {
        showToast("Filtered by Produce boxes");
      } else if (cat === "bakery") {
        showToast("Filtered by Fresh Bakery");
      } else if (cat === "meals") {
        showToast("Filtered by Prepared Meals");
      } else if (cat === "cafe") {
        showToast("Filtered by Coffee & Cafés");
      } else {
        showToast("Showing all rescue categories");
      }
    });
  });

  // Search Filter Interaction
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      const cards = document.querySelectorAll("#rescue-list .rescue-card");
      let visibleCount = 0;

      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        const matches = text.includes(term);
        card.style.display = matches ? "block" : "none";
        if (matches) visibleCount++;
      });

      if (term.length > 0 && visibleCount === 0) {
        showToast("No matches found. Try 'bakery' or 'produce'");
      }
    });
  }

  // Favorites / Heart Toggle
  document.querySelectorAll(".heart-btn, .heart-toggle-detail").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      btn.classList.toggle("liked");
      const isLiked = btn.classList.contains("liked");
      btn.textContent = isLiked ? "♥" : "♡";
      showToast(isLiked ? "Added to Saved Favorites" : "Removed from Saved");
    });
  });

  // Quantity Controls in Checkout
  const qtyMinus = document.getElementById("qty-minus");
  const qtyPlus = document.getElementById("qty-plus");
  const qtyValue = document.getElementById("qty-value");
  const checkoutTotal = document.getElementById("checkout-total");
  const checkoutTotalCta = document.getElementById("checkout-total-cta");

  function updateQuantity(newQty) {
    if (newQty < 1 || newQty > 5) return;
    currentQuantity = newQty;
    if (qtyValue) qtyValue.textContent = `${currentQuantity} ${currentQuantity === 1 ? 'box' : 'boxes'}`;

    const subtotal = basePrice * currentQuantity;
    const grandTotal = (subtotal + serviceFee).toFixed(2);

    if (checkoutTotal) checkoutTotal.textContent = `$${grandTotal}`;
    if (checkoutTotalCta) checkoutTotalCta.textContent = `$${grandTotal}`;
  }

  if (qtyMinus && qtyPlus) {
    qtyMinus.addEventListener("click", () => updateQuantity(currentQuantity - 1));
    qtyPlus.addEventListener("click", () => updateQuantity(currentQuantity + 1));
  }

  // Add to Calendar Interaction
  const addCalBtn = document.getElementById("add-cal-btn");
  if (addCalBtn) {
    addCalBtn.addEventListener("click", () => {
      showToast("📅 Added pickup reminder to Calendar!");
    });
  }

  // Tab Bar Active States
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("selected"));
      tab.classList.add("selected");
    });
  });

  // Location Picker Simulation
  const locPicker = document.getElementById("location-picker");
  if (locPicker) {
    locPicker.addEventListener("click", () => {
      showToast("📍 Location set to Brooklyn, NY (Within 3 miles)");
    });
  }
});
