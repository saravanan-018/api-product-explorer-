# Goods — Product Explorer

A responsive, dependency-free product catalog that loads products from the public
[DummyJSON Products API](https://dummyjson.com/docs/products).

## Run it

Open `index.html` in a browser. If your browser blocks API requests from local
files, serve this folder with any static file server, for example:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000`.

The catalog loads up to 100 products and supports live text search, category
filtering, and sorting by price or rating. If the API request fails, use **Try
again** to reload the collection.
