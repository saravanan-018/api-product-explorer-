const PRODUCTS_URL = "https://dummyjson.com/products?limit=100";
const productGrid = document.querySelector("#product-grid");
const statusPanel = document.querySelector("#status");
const searchInput = document.querySelector("#search-input");
const categoryFilter = document.querySelector("#category-filter");
const sortSelect = document.querySelector("#sort-select");
const resultCount = document.querySelector("#result-count");

let products = [];

function showStatus(message, { loading = false, retry = false } = {}) {
  statusPanel.replaceChildren();
  statusPanel.classList.add("is-visible");

  if (loading) {
    const loader = document.createElement("span");
    loader.className = "loader";
    loader.setAttribute("aria-hidden", "true");
    statusPanel.append(loader);
  }

  const text = document.createElement("p");
  text.textContent = message;
  statusPanel.append(text);

  if (retry) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Try again";
    button.addEventListener("click", loadProducts);
    statusPanel.append(button);
  }
}

function setControlsEnabled(enabled) {
  categoryFilter.disabled = !enabled;
  sortSelect.disabled = !enabled;
  searchInput.disabled = !enabled;
}

function populateCategories(items) {
  const categories = [...new Set(items.map((product) => product.category))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  categoryFilter.replaceChildren(new Option("All categories", "all"));
  for (const category of categories) {
    categoryFilter.add(new Option(category.replaceAll("-", " "), category));
  }
}

function getVisibleProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const category = categoryFilter.value;
  const sort = sortSelect.value;

  const filtered = products.filter((product) => {
    const matchesQuery =
      !query ||
      product.title.toLocaleLowerCase().includes(query) ||
      product.description.toLocaleLowerCase().includes(query) ||
      product.category.toLocaleLowerCase().includes(query);
    const matchesCategory = category === "all" || product.category === category;

    return matchesQuery && matchesCategory;
  });

  if (sort === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  return filtered;
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";

  const imageWrap = document.createElement("div");
  imageWrap.className = "product-image-wrap";

  const image = document.createElement("img");
  image.className = "product-image";
  image.src = product.thumbnail;
  image.alt = product.title;
  image.loading = "lazy";
  image.addEventListener(
    "error",
    () => {
      imageWrap.replaceChildren();
      imageWrap.setAttribute("aria-label", `${product.title} image unavailable`);
      imageWrap.classList.add("image-unavailable");
    },
    { once: true },
  );

  const category = document.createElement("span");
  category.className = "product-category";
  category.textContent = product.category.replaceAll("-", " ");
  imageWrap.append(image, category);

  const info = document.createElement("div");
  info.className = "product-info";

  const title = document.createElement("h3");
  title.className = "product-title";
  title.textContent = product.title;

  const meta = document.createElement("div");
  meta.className = "product-meta";

  const price = document.createElement("span");
  price.className = "product-price";
  price.textContent = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price);

  const rating = document.createElement("span");
  rating.className = "product-rating";
  rating.innerHTML = `<span class="star" aria-hidden="true">★</span>${product.rating.toFixed(1)}`;
  rating.setAttribute("aria-label", `Rated ${product.rating.toFixed(1)} out of 5`);

  meta.append(price, rating);
  info.append(title, meta);
  card.append(imageWrap, info);

  return card;
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  productGrid.replaceChildren(...visibleProducts.map(createProductCard));
  productGrid.setAttribute("aria-busy", "false");
  resultCount.textContent = `${visibleProducts.length} ${
    visibleProducts.length === 1 ? "find" : "finds"
  }`;

  if (visibleProducts.length === 0) {
    showStatus("No finds match those filters. Try another search or category.");
  } else {
    statusPanel.classList.remove("is-visible");
    statusPanel.replaceChildren();
  }
}

async function loadProducts() {
  productGrid.replaceChildren();
  productGrid.setAttribute("aria-busy", "true");
  resultCount.textContent = "Loading collection...";
  setControlsEnabled(false);
  showStatus("Finding the good stuff...", { loading: true });

  try {
    const response = await fetch(PRODUCTS_URL);
    if (!response.ok) {
      throw new Error(`Product service responded with ${response.status}.`);
    }

    const data = await response.json();
    if (!Array.isArray(data.products)) {
      throw new Error("The product service returned an unexpected response.");
    }

    products = data.products.filter(
      (product) =>
        typeof product.id === "number" &&
        typeof product.title === "string" &&
        typeof product.description === "string" &&
        typeof product.category === "string" &&
        typeof product.price === "number" &&
        typeof product.rating === "number" &&
        typeof product.thumbnail === "string",
    );

    if (products.length === 0) {
      throw new Error("The product service did not return any usable products.");
    }

    populateCategories(products);
    setControlsEnabled(true);
    renderProducts();
  } catch (error) {
    productGrid.setAttribute("aria-busy", "false");
    resultCount.textContent = "Collection unavailable";
    showStatus(
      `We couldn't load the collection. ${error instanceof Error ? error.message : "Please try again."}`,
      { retry: true },
    );
  }
}

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
sortSelect.addEventListener("change", renderProducts);

document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
  ) {
    event.preventDefault();
    searchInput.focus();
  }
});

loadProducts();
