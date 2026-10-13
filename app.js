const screens = ["welcome", "auth", "home", "details", "reserve", "success", "empty", "error", "loading", "soldout", "explore", "saved", "profile", "shop"];
const products = {
  bakery: { name: "Morning bakery surprise box", merchant: "Le Petit Grain Bakery", shortMerchant: "Le Petit Grain", price: 5, retail: 18, stock: 3, category: "bakery", emoji: "🥐", image: "bakery-image", pickup: "182 Atlantic Ave, Brooklyn NY", distance: "0.3", contents: "4–6 items", window: "10:00–10:30 AM", diet: "Vegetarian", description: "A delicious assortment of today's freshly baked pastries, croissants, brioches and sourdough loaves. Help reduce waste while enjoying neighbourhood bakery favourites." },
  produce: { name: "Seasonal organic produce box", merchant: "Green Basket Co-op", shortMerchant: "Green Basket", price: 7, retail: 24, stock: 5, category: "produce", emoji: "🥬", image: "produce-image", pickup: "48 Court St, Brooklyn NY", distance: "0.7", contents: "Seasonal produce", window: "5:00–7:00 PM", diet: "Plant-based", description: "A seasonal mix of organic fruit, herbs and leafy greens from a local co-op. Contents vary with the day's harvest, and every box helps reduce food waste." },
  cafe: { name: "Daily Espresso & Bagel Bag", merchant: "Brooklyn Craft Roast", shortMerchant: "Brooklyn Craft Roast", price: 4.5, retail: 15, stock: 0, category: "cafe", emoji: "☕", image: "cafe-image", pickup: "12 Smith St, Brooklyn NY", distance: "0.5", contents: "2–4 items", window: "4:00–4:30 PM", diet: "Vegetarian options", description: "Fresh bagels and specialty coffee treats from a neighbourhood café. Today's surplus boxes have all been claimed." }
};
const serviceFeePerBox = 0.5;
const pickupSlots = ["Today, 10:00 AM–10:30 AM", "Today, 4:00 PM–4:30 PM", "Today, 6:00 PM–6:30 PM"];
let currentScreen = "welcome";
let previousScreen = "welcome";
let selectedItem = "bakery";
let currentQuantity = 1;
let authMode = "login";
let currentCategory = "all";
let retryDestination = "home";
let errorBackDestination = "welcome";
let simulatedOffline = new URLSearchParams(location.search).get("error") === "1";
let firstHomeLoad = true;
let completedReservation = null;
let currentUser = readStore("savor-user", null);
let favorites = readStore("savor-favorites", []);
let reservations = readStore("savor-reservations", []);
let notifications = readStore("savor-notifications", []);
const savedStock = readStore("savor-stock", {});
Object.keys(products).forEach((id) => {
  if (Number.isInteger(savedStock[id]) && savedStock[id] >= 0) products[id].stock = savedStock[id];
});
let detailReturnScreen = "home";

function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showToast("This change could not be saved on this device.");
    return false;
  }
}

function updateLiveTime() {
  const elem = document.getElementById("live-time");
  if (elem) elem.textContent = `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}`;
}

function showScreen(name, options = {}) {
  if (!screens.includes(name)) return;
  if (!options.keepPrevious && name !== currentScreen) previousScreen = currentScreen;
  currentScreen = name;
  screens.forEach((id) => document.getElementById(`screen-${id}`)?.classList.toggle("active", id === name));
  document.querySelectorAll(".demo-btn").forEach((button) => button.classList.toggle("active", button.dataset.go === name));
  document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("selected", button.dataset.tab === name));
  const active = document.getElementById(`screen-${name}`);
  active?.querySelector(".home-scroll, .detail-scroll, .reserve-scroll")?.scrollTo(0, 0);
  if (name === "saved") renderSaved();
  if (name === "profile") renderProfile();
  if (name === "explore") renderExplore();
  if (name === "home") syncFavorites();
}

function showToast(message) {
  const node = document.getElementById("toast");
  if (!node) return;
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => node.classList.remove("show"), 2400);
}

function navigate(name) {
  if (name === "home") {
    if (firstHomeLoad || simulatedOffline) {
      retryDestination = "home";
      loadHome(false);
      return;
    }
    showScreen("home");
    return;
  }
  if (name === "details") {
    if (currentScreen !== "shop") detailReturnScreen = currentScreen;
    if (products[selectedItem].stock < 1) {
      renderSoldOut();
      showScreen("soldout");
    }
    else {
      renderDetails();
      showScreen("details");
    }
    return;
  }
  if (name === "soldout") {
    detailReturnScreen = currentScreen;
    renderSoldOut();
    showScreen("soldout");
    return;
  }
  showScreen(name);
}

function loadHome(isRetry) {
  retryDestination = "home";
  if (simulatedOffline) {
    errorBackDestination = currentScreen;
    document.getElementById("error-back").dataset.go = errorBackDestination;
    showScreen("error");
    return;
  }
  if (!isRetry && !firstHomeLoad) {
    showScreen("home");
    return;
  }
  const skeleton = document.getElementById("home-skeleton");
  const list = document.getElementById("rescue-list");
  if (skeleton) skeleton.hidden = false;
  if (list) list.hidden = true;
  showScreen("home");
  setTimeout(() => {
    if (skeleton) skeleton.hidden = true;
    if (list) list.hidden = false;
    firstHomeLoad = false;
    applyHomeFilters();
  }, 650);
}

function syncFavorites() {
  document.querySelectorAll("[data-favorite]").forEach((button) => {
    const liked = favorites.includes(button.dataset.favorite);
    button.classList.toggle("liked", liked);
    button.textContent = liked ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(liked));
    const product = products[button.dataset.favorite];
    if (product) button.setAttribute("aria-label", `${liked ? "Remove" : "Save"} ${product.name} ${liked ? "from" : "to"} favorites`);
  });
}

function syncProductCards() {
  document.querySelectorAll(".rescue-card[data-item]").forEach((card) => {
    const item = products[card.dataset.item];
    if (!item) return;
    const tag = card.querySelector(".image-tag");
    const time = card.querySelector(".time");
    const soldOut = item.stock < 1;
    tag.textContent = soldOut ? "SOLD OUT" : `${item.stock} BOXES LEFT`;
    tag.classList.toggle("tag-soldout", soldOut);
    time.textContent = soldOut ? "● All boxes claimed" : "● Pickup today";
    time.classList.toggle("disabled-text", soldOut);
    card.classList.toggle("sold-out-card", soldOut);
  });
}

function toggleFavorite(id) {
  if (!products[id]) return;
  favorites = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
  writeStore("savor-favorites", favorites);
  syncFavorites();
  if (currentScreen === "saved") renderSaved();
  showToast(favorites.includes(id) ? "Added to saved rescues" : "Removed from saved rescues");
}

function cardMarkup(id) {
  const product = products[id];
  const soldOut = product.stock === 0;
  return `<article class="rescue-card ${soldOut ? "sold-out-card" : ""}" data-go="details" data-item="${id}" data-category="${product.category}" tabindex="0" role="button" aria-label="View ${product.name}">
    <div class="food-image ${product.image}"><span class="image-tag ${soldOut ? "tag-soldout" : ""}">${soldOut ? "SOLD OUT" : `${product.stock} BOXES LEFT`}</span>
      <button class="heart-btn ${favorites.includes(id) ? "liked" : ""}" type="button" data-favorite="${id}" aria-label="Save ${product.name} to favorites" aria-pressed="${favorites.includes(id)}">${favorites.includes(id) ? "♥" : "♡"}</button>
      <div class="food-emoji">${product.emoji}</div>
    </div>
    <div class="card-info"><div class="merchant-line"><span>${product.merchant}</span><span class="distance">${product.distance} mi</span></div>
      <h3>${product.name}</h3><p>${id === "bakery" ? "Freshly baked pastries and sourdough" : id === "produce" ? "Organic fruit, herbs and leafy greens" : "Fresh bagels and specialty coffee treats"}</p>
      <div class="card-bottom"><strong>${money(product.price)} <del>${money(product.retail)}</del></strong><span class="time ${soldOut ? "disabled-text" : ""}">${soldOut ? "● All boxes claimed" : "● Pickup today"}</span></div>
    </div>
  </article>`;
}

function renderDetails() {
  const item = products[selectedItem];
  document.getElementById("detail-name").textContent = item.name;
  document.getElementById("remaining-stock").textContent = item.stock;
  const image = document.querySelector("#screen-details .detail-image");
  image.className = `detail-image ${item.image}`;
  image.querySelector(".detail-food").textContent = item.emoji;
  document.getElementById("remaining-stock").textContent = item.stock;
  const merchantLine = document.querySelector("#screen-details .merchant-line > span:first-child");
  merchantLine.textContent = `${item.merchant.toUpperCase()} · 0.3 MI AWAY`;
  document.querySelector("#screen-details .detail-description").textContent = item.description;
  const facts = document.querySelectorAll("#screen-details .detail-facts div");
  facts[0].querySelector("strong").textContent = item.contents;
  facts[1].querySelector("strong").textContent = item.window;
  facts[2].querySelector("strong").textContent = item.diet;
  document.querySelector("#screen-details .seller-logo").textContent = item.merchant.slice(0, 2).toUpperCase();
  document.querySelector("#screen-details .seller strong").textContent = item.merchant;
  const detailFavorite = document.querySelector("#screen-details .heart-toggle-detail");
  detailFavorite.dataset.favorite = selectedItem;
  detailFavorite.setAttribute("aria-label", `Save ${item.name} to favorites`);
  document.querySelector("#screen-shop h1").textContent = item.merchant;
  document.querySelector("#screen-shop .seller-logo").textContent = item.merchant.slice(0, 2).toUpperCase();
  document.querySelector("#screen-shop .shop-address").textContent = item.pickup;
  document.querySelector("#screen-details .bottom-cta .price").textContent = money(item.price);
  document.querySelector("#screen-details .bottom-cta del").textContent = money(item.retail);
  document.getElementById("reserve-from-details").disabled = item.stock < 1;
  document.getElementById("reserve-from-details").classList.toggle("disabled-btn", item.stock < 1);
  syncFavorites();
}

function renderSoldOut() {
  const item = products[selectedItem];
  const screen = document.getElementById("screen-soldout");
  screen.querySelector(".detail-image").className = `detail-image ${item.image}`;
  screen.querySelector(".detail-food").textContent = item.emoji;
  screen.querySelector(".detail-content h1").textContent = item.name;
  screen.querySelector(".detail-description").textContent = `${item.description} New surplus boxes may be available on another day.`;
  screen.querySelector(".merchant-line > span:first-child").textContent = `${item.merchant.toUpperCase()} · NEARBY`;
  screen.querySelector(".seller-logo").textContent = item.merchant.slice(0, 2).toUpperCase();
  screen.querySelector(".seller strong").textContent = item.merchant;
  screen.querySelector(".bottom-cta .price").textContent = money(item.price);
  const favorite = screen.querySelector("[data-favorite]");
  favorite.dataset.favorite = selectedItem;
  favorite.setAttribute("aria-label", `Save ${item.name} to favorites`);
  const button = screen.querySelector("#notify-toggle");
  const subscribed = notifications.includes(selectedItem);
  button.textContent = subscribed ? "You'll be notified" : "Notify me when available";
  button.setAttribute("aria-pressed", String(subscribed));
  syncFavorites();
}

function beginReservation() {
  const item = products[selectedItem];
  currentQuantity = 1;
  document.getElementById("reserve-emoji").textContent = item.emoji;
  document.getElementById("reserve-emoji").className = `mini-food ${item.image}`;
  document.getElementById("reserve-item-name").textContent = item.name;
  document.getElementById("reserve-merchant").textContent = `${item.shortMerchant} · Today`;
  document.getElementById("reserve-unit-price").textContent = `${money(item.price)} each`;
  document.getElementById("pickup-name").value = currentUser?.name || "";
  document.querySelectorAll('input[name="pickup-time"]').forEach((input) => { input.checked = input.value === pickupSlots[0]; });
  document.querySelector('input[name="payment-method"][value="Card"]').checked = true;
  document.getElementById("pickup-time-error").textContent = "";
  document.getElementById("reserve-selection-summary").textContent = `${pickupSlots[0]} · Card`;
  document.getElementById("pickup-name-error")?.remove();
  document.getElementById("qty-plus").disabled = item.stock <= 1;
  document.getElementById("qty-minus").disabled = true;
  document.getElementById("qty-value").textContent = `1 of ${item.stock}`;
  updateTotal();
}

function updateTotal() {
  const item = products[selectedItem];
  const subtotal = item.price * currentQuantity;
  const fee = serviceFeePerBox * currentQuantity;
  const total = subtotal + fee;
  document.getElementById("qty-value").textContent = `${currentQuantity} of ${item.stock}`;
  document.getElementById("qty-minus").disabled = currentQuantity <= 1;
  document.getElementById("qty-plus").disabled = currentQuantity >= item.stock;
  document.getElementById("subtotal-quantity").textContent = currentQuantity;
  document.getElementById("checkout-subtotal").textContent = money(subtotal);
  document.querySelector(".price-breakdown .breakdown-row:nth-child(2) span:last-child").textContent = money(fee);
  document.getElementById("checkout-total").textContent = money(total);
  document.getElementById("checkout-total-cta").textContent = money(total);
}

function applyHomeFilters() {
  const term = document.getElementById("search-input").value.trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll("#rescue-list .rescue-card").forEach((card) => {
    const match = (currentCategory === "all" || card.dataset.category === currentCategory) && card.textContent.toLowerCase().includes(term);
    card.hidden = !match;
    if (match) visible++;
  });
  const empty = document.getElementById("search-empty");
  empty.hidden = visible > 0;
  empty.querySelector("strong").textContent = term ? "No matches nearby" : "No rescues in this category yet";
  empty.querySelector("p").textContent = term ? "Try a different search or browse all rescue boxes." : "Choose another category to see more nearby food.";
  document.getElementById("clear-search").textContent = term ? "Clear search" : "Show all categories";
}

function selectedCategory(row) {
  return row.querySelector(".category.active")?.dataset.cat || "all";
}

function renderExplore() {
  const list = document.getElementById("explore-list");
  if (!list) return;
  list.innerHTML = Object.keys(products).map(cardMarkup).join("");
  const category = selectedCategory(document.querySelector(".explore-categories"));
  list.querySelectorAll(".rescue-card").forEach((card) => { card.hidden = category !== "all" && card.dataset.category !== category; });
  document.getElementById("explore-empty").hidden = [...list.children].some((card) => !card.hidden);
  syncFavorites();
}

function renderSaved() {
  const list = document.getElementById("saved-list");
  if (!list) return;
  list.innerHTML = favorites.filter((id) => products[id]).map(cardMarkup).join("");
  document.getElementById("saved-empty").hidden = list.children.length > 0;
  syncFavorites();
}

function renderProfile() {
  const name = currentUser?.name || "Food rescuer";
  document.getElementById("profile-name").textContent = name;
  document.getElementById("profile-email").textContent = currentUser?.email || "Local demo account";
  document.getElementById("profile-avatar").textContent = name[0]?.toUpperCase() || "S";
  document.getElementById("greeting-name").textContent = name.split(" ")[0] || "there";
  const history = document.getElementById("reservation-history");
  history.innerHTML = reservations.map((booking) => `<article class="history-card"><strong>${booking.productName}</strong><p>${booking.quantity} box${booking.quantity === 1 ? "" : "es"} · ${booking.pickupTime}</p><p>${booking.payment} · ${money(booking.total)}</p></article>`).join("");
  document.getElementById("reservations-empty").hidden = reservations.length > 0;
  document.getElementById("offline-toggle").checked = simulatedOffline;
}

function updateSuccess(booking) {
  document.getElementById("success-message").textContent = `${booking.productName} at ${booking.merchant}.`;
  document.getElementById("success-time").textContent = booking.pickupTime;
  document.getElementById("success-quantity").textContent = booking.quantity;
  document.querySelector("#screen-success .ticket-code b").textContent = booking.quantity === 1 ? "BOX" : "BOXES";
  document.getElementById("success-merchant").textContent = booking.merchant;
  document.querySelector("#screen-success .ticket-bottom p").textContent = booking.pickup;
  document.getElementById("success-payment").textContent = `Payment: ${booking.payment}`;
  document.getElementById("success-total").textContent = money(booking.total);
  document.getElementById("success-pickup-name").textContent = `Pickup for ${booking.pickupName}`;
  document.querySelector("#screen-success .seller-logo").textContent = booking.merchant.slice(0, 2).toUpperCase();
}

function money(value) {
  return `$${value.toFixed(2)}`;
}

function setFieldError(id, message) {
  const elem = document.getElementById(id);
  if (elem) elem.textContent = message;
}

function validateAuth() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  setFieldError("email-error", emailValid ? "" : "Enter a valid email address.");
  setFieldError("password-error", password.length >= 8 ? "" : "Use at least 8 characters.");
  return emailValid && password.length >= 8;
}

function completeBooking() {
  const selectedSlot = document.querySelector('input[name="pickup-time"]:checked');
  const pickupName = document.getElementById("pickup-name").value.trim();
  if (!selectedSlot) {
    setFieldError("pickup-time-error", "Choose a pickup time to continue.");
    document.getElementById("pickup-slots").scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  setFieldError("pickup-time-error", "");
  if (!pickupName) {
    let error = document.getElementById("pickup-name-error");
    if (!error) {
      error = document.createElement("small");
      error.className = "field-error";
      error.id = "pickup-name-error";
      document.getElementById("pickup-name").after(error);
    }
    error.textContent = "Enter the name of the person collecting the box.";
    return;
  }
  const button = document.getElementById("confirm-reservation-btn");
  button.disabled = true;
  button.textContent = "Confirming your rescue…";
  setTimeout(() => {
    const item = products[selectedItem];
    const payment = document.querySelector('input[name="payment-method"]:checked').value;
    completedReservation = {
      id: `SVR-${Date.now()}`,
      productId: selectedItem,
      productName: item.name,
      merchant: item.merchant,
      quantity: currentQuantity,
      pickupTime: selectedSlot.value,
      payment,
      pickupName,
      total: (item.price + serviceFeePerBox) * currentQuantity,
      pickup: item.pickup,
      createdAt: new Date().toISOString()
    };
    reservations = [completedReservation, ...reservations];
    writeStore("savor-reservations", reservations);
    item.stock = Math.max(0, item.stock - currentQuantity);
    const stock = readStore("savor-stock", {});
    stock[selectedItem] = item.stock;
    writeStore("savor-stock", stock);
    syncProductCards();
    updateSuccess(completedReservation);
    button.disabled = false;
    button.textContent = "Confirm reservation";
    showScreen("success");
  }, 1500);
}

function retryLoading() {
  retryDestination = currentScreen === "error" ? retryDestination : previousScreen;
  simulatedOffline = document.getElementById("offline-toggle")?.checked || false;
  if (new URLSearchParams(location.search).has("error")) {
    history.replaceState({}, "", `${location.pathname}${location.hash}`);
    simulatedOffline = false;
  }
  document.getElementById("loading-back").dataset.go = retryDestination;
  showScreen("loading");
  setTimeout(() => {
    if (simulatedOffline) {
      document.getElementById("error-back").dataset.go = errorBackDestination;
      showScreen("error");
      return;
    }
    firstHomeLoad = false;
    document.getElementById("home-skeleton").hidden = true;
    document.getElementById("rescue-list").hidden = false;
    showScreen(retryDestination);
    showToast("Rescues refreshed.");
  }, 700);
}

function setupCategories() {
  const template = document.getElementById("category-row");
  const explore = document.querySelector(".explore-categories");
  explore.innerHTML = template.innerHTML;
  explore.querySelectorAll(".category").forEach((button) => {
    button.classList.toggle("active", button.dataset.cat === "all");
    button.setAttribute("aria-pressed", String(button.dataset.cat === "all"));
  });
}

function downloadCalendar() {
  if (!completedReservation) return;
  const start = new Date();
  const timeMatch = completedReservation.pickupTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hour = timeMatch ? Number(timeMatch[1]) : 16;
  if (timeMatch?.[3].toUpperCase() === "PM" && hour < 12) hour += 12;
  if (timeMatch?.[3].toUpperCase() === "AM" && hour === 12) hour = 0;
  start.setHours(hour, timeMatch ? Number(timeMatch[2]) : 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const format = (date) => `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}00`;
  const escape = (text) => text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const event = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `UID:${completedReservation.id}@savor.local`, `DTSTAMP:${format(new Date())}`, `DTSTART:${format(start)}`, `DTEND:${format(end)}`, `SUMMARY:${escape(`Savor pickup: ${completedReservation.productName}`)}`, `LOCATION:${escape(completedReservation.pickup)}`, `DESCRIPTION:${escape(`${completedReservation.quantity} box(es) · ${completedReservation.pickupTime}`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([event], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "savor-pickup.ics";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Pickup reminder downloaded.");
}

function shareCurrentProduct() {
  const item = products[selectedItem];
  const data = { title: item.name, text: `Rescue ${item.name} from ${item.merchant} with Savor.`, url: location.href };
  if (navigator.share) {
    navigator.share(data).catch((error) => {
      if (error.name !== "AbortError") showToast("Sharing isn't available here.");
    });
  } else {
    showToast(`${item.name} — ${item.merchant}`);
  }
}

function openInfoModal(type) {
  const dialog = document.getElementById("info-modal");
  document.getElementById("modal-title").textContent = type === "terms" ? "Terms of Service" : "Privacy Policy";
  document.getElementById("modal-copy").textContent = type === "terms"
    ? "Savor helps neighbours discover and reserve surplus food from local shops. This demo stores reservations and saved items only in this browser."
    : "This static demo keeps your profile, saved boxes and reservation history in local browser storage. No information is sent to a server.";
  dialog.showModal();
}

document.addEventListener("DOMContentLoaded", () => {
  updateLiveTime();
  setInterval(updateLiveTime, 30000);
  document.body.classList.toggle("demo-mode", new URLSearchParams(location.search).get("demo") === "1");
  setupCategories();
  const date = new Date();
  document.getElementById("today-label").textContent = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
  document.getElementById("greeting-name").textContent = currentUser?.name?.split(" ")[0] || "there";
  syncFavorites();
  syncProductCards();

  document.body.addEventListener("click", (event) => {
    const target = event.target.closest("[data-favorite]");
    if (target) {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(target.dataset.favorite);
      return;
    }
    const category = event.target.closest(".category");
    if (category) {
      const row = category.closest(".category-row");
      row.querySelectorAll(".category").forEach((button) => {
        const active = button === category;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      if (row.id === "category-row") {
        currentCategory = category.dataset.cat;
        applyHomeFilters();
      } else renderExplore();
      return;
    }
    const modalTrigger = event.target.closest("[data-modal]");
    if (modalTrigger) {
      openInfoModal(modalTrigger.dataset.modal);
      return;
    }
    const route = event.target.closest("[data-go]");
    if (route) {
      const targetScreen = route.dataset.go;
      if (route.closest(".rescue-card")) selectedItem = route.closest(".rescue-card").dataset.item;
      if (targetScreen === "reserve") beginReservation();
      navigate(targetScreen);
    }
  });

  document.getElementById("auth-mode-toggle").addEventListener("click", () => {
    authMode = authMode === "login" ? "signup" : "login";
    const signup = authMode === "signup";
    document.querySelector(".signup-name").hidden = !signup;
    document.getElementById("password").autocomplete = signup ? "new-password" : "current-password";
    document.getElementById("auth-submit-btn").innerHTML = `${signup ? "Create account" : "Log in"} <span>→</span>`;
    document.getElementById("auth-toggle-prompt").textContent = signup ? "Already have an account?" : "New to Savor?";
    document.getElementById("auth-mode-toggle").textContent = signup ? "Log in" : "Create an account";
  });

  document.getElementById("auth-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateAuth()) return;
    if (authMode === "signup" && !document.getElementById("auth-name").value.trim()) {
      showToast("Enter your name to create an account.");
      document.getElementById("auth-name").focus();
      return;
    }
    const button = document.getElementById("auth-submit-btn");
    button.disabled = true;
    button.textContent = "Signing you in…";
    setTimeout(() => {
      currentUser = {
        name: authMode === "signup" ? document.getElementById("auth-name").value.trim() : (currentUser?.name || "Food rescuer"),
        email: document.getElementById("email").value.trim()
      };
      writeStore("savor-user", currentUser);
      button.disabled = false;
      button.innerHTML = `${authMode === "signup" ? "Create account" : "Log in"} <span>→</span>`;
      firstHomeLoad = true;
      navigate("home");
    }, 500);
  });

  document.getElementById("toggle-password").addEventListener("click", (event) => {
    const input = document.getElementById("password");
    input.type = input.type === "password" ? "text" : "password";
    event.currentTarget.setAttribute("aria-label", input.type === "password" ? "Show password" : "Hide password");
    event.currentTarget.textContent = input.type === "password" ? "👁" : "🙈";
  });

  document.getElementById("search-input").addEventListener("input", applyHomeFilters);
  document.getElementById("clear-search").addEventListener("click", () => {
    document.getElementById("search-input").value = "";
    currentCategory = "all";
    document.querySelectorAll("#category-row .category").forEach((button) => {
      const active = button.dataset.cat === "all";
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    applyHomeFilters();
    document.getElementById("search-input").focus();
  });

  document.getElementById("qty-minus").addEventListener("click", () => {
    currentQuantity = Math.max(1, currentQuantity - 1);
    updateTotal();
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    currentQuantity = Math.min(products[selectedItem].stock, currentQuantity + 1);
    updateTotal();
  });
  const updateSelectedSummary = () => {
    const time = document.querySelector('input[name="pickup-time"]:checked')?.value || "No pickup time selected";
    const payment = document.querySelector('input[name="payment-method"]:checked')?.value || "No payment selected";
    document.getElementById("reserve-selection-summary").textContent = `${time} · ${payment}`;
  };
  document.querySelectorAll('input[name="pickup-time"]').forEach((input) => input.addEventListener("change", () => {
    setFieldError("pickup-time-error", "");
    updateSelectedSummary();
  }));
  document.getElementById("clear-pickup-time").addEventListener("click", () => {
    document.querySelectorAll('input[name="pickup-time"]').forEach((input) => { input.checked = false; });
    updateSelectedSummary();
  });
  document.querySelectorAll('input[name="payment-method"]').forEach((input) => input.addEventListener("change", updateSelectedSummary));
  document.getElementById("confirm-reservation-btn").addEventListener("click", completeBooking);
  document.getElementById("retry-error-btn").addEventListener("click", retryLoading);
  document.getElementById("offline-toggle").addEventListener("change", (event) => {
    simulatedOffline = event.target.checked;
    if (simulatedOffline) showToast("Offline mode is on. Loading rescues will fail.");
    else showToast("Connection restored.");
    writeStore("savor-offline", simulatedOffline);
  });
  if (readStore("savor-offline", false)) simulatedOffline = true;
  document.getElementById("logout-btn").addEventListener("click", () => {
    currentUser = null;
    try { localStorage.removeItem("savor-user"); } catch { showToast("Could not clear the local profile."); }
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    showScreen("welcome");
  });
  document.getElementById("view-shop-btn").addEventListener("click", () => showScreen("shop"));
  document.querySelector("#screen-details .detail-header [data-go]").addEventListener("click", (event) => {
    event.currentTarget.dataset.go = detailReturnScreen;
  });
  document.querySelector("#screen-soldout .detail-header [data-go]").addEventListener("click", (event) => {
    event.currentTarget.dataset.go = detailReturnScreen;
  });
  document.querySelector(".share-detail").addEventListener("click", shareCurrentProduct);
  document.getElementById("notify-toggle").addEventListener("click", (event) => {
    const id = selectedItem;
    const subscribed = notifications.includes(id);
    notifications = subscribed ? notifications.filter((value) => value !== id) : [...notifications, id];
    writeStore("savor-notifications", notifications);
    event.currentTarget.textContent = subscribed ? "Notify me when available" : "You'll be notified";
    event.currentTarget.setAttribute("aria-pressed", String(!subscribed));
  });
  document.getElementById("add-cal-btn").addEventListener("click", downloadCalendar);
  document.getElementById("modal-dismiss").addEventListener("click", () => document.getElementById("info-modal").close());
  document.getElementById("location-picker").addEventListener("click", () => showToast("Showing nearby shops in your selected area."));
  document.getElementById("existing-account-btn").addEventListener("click", () => {
    authMode = "login";
    document.querySelector(".signup-name").hidden = true;
    document.getElementById("auth-toggle-prompt").textContent = "New to Savor?";
    document.getElementById("auth-mode-toggle").textContent = "Create an account";
    document.getElementById("auth-submit-btn").innerHTML = "Log in <span>→</span>";
  });

  const notify = document.getElementById("notify-toggle");
  if (notifications.includes("cafe")) {
    notify.textContent = "You'll be notified";
    notify.setAttribute("aria-pressed", "true");
  }
  document.body.addEventListener("keydown", (event) => {
    const card = event.target.closest(".rescue-card");
    if (card && (event.key === "Enter" || event.key === " ") && !event.target.closest("button")) {
      event.preventDefault();
      selectedItem = card.dataset.item;
      navigate("details");
    }
  });
});
