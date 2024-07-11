import fs from "fs";
import axios from "axios"; // Import Axios for making HTTP requests
import express from "express";
import cors from "cors";
import cron from "node-cron";

const username = "90478305_003_TEST\\AI";
const password = "1234";
const auth = Buffer.from(`${username}:${password}`).toString("base64");

const app = express();
app.use(cors()); // Use the cors middleware

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Update * to your specific origin if needed
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const headers = {
  Authorization: `Basic ${auth}`,
  "Content-Type": "application/json",
};

let items;
async function fetchCatalog() {
  try {
    const allCatalogUrl =
      "https://extcatalogvw-server.onrender.com/items/getAllCatalog";
    const response = await axios.get(allCatalogUrl, { headers });
    console.log(response.data); // Log the response data
    items = response.data;

    const allPricesList =
      "https://extcatalogvw-server.onrender.com/items/getAllPrices";
    const priceResponse = await axios.get(allPricesList, { headers });

    for (let i = 0; i < items.length; i++) {
      items[i].price = priceResponse.data.priceLists[i];
    }

    const fetchWarehouses = items.map(async (item) => {
      const warehouseId = await fetchWarehouse(item.identifier.id); // Fetch price for each item
      if (warehouseId) {
        item.warehouseId = warehouseId; // Assign price to item if available
      }
    });

    await Promise.all(fetchWarehouses);

    const fetchImagePromises = items.map(async (item) => {
      const imageUrl = await fetchImage(item.identifier.id); // Fetch image for each item
      if (imageUrl) {
        item.imgUrl = imageUrl; // Assign imageUrl to item if available
      }
    });
    await Promise.all(fetchImagePromises);
    console.log(items);
  } catch (error) {
    console.error("Error fetching catalog:", error); // Handle errors
  }
}

if (checkItemsEmpty) {
  fetchCatalog();
}

ron.schedule('0 6,9,15,18,20,0 * * *', () => {
  fetchCatalog();
  // Add the task you want to run here
});
// Call the async function

async function fetchWarehouse(item) {
  try {
    const warehouseUrl = `https://90478305-partner-retail-ondemand.cegid.cloud/Y2/90478305_003_TEST/api/available-quantities/v1?itemIds=${encodeURIComponent(
      item
    )}`;

    console.log(warehouseUrl);
    const response = await axios.get(warehouseUrl, { headers });
    const warehouseData = response.data;

    console.log(warehouseData);

    if (!Array.isArray(warehouseData)) {
      console.error(
        `Invalid response structure: ${JSON.stringify(warehouseData)}`
      );
      return null;
    }

    const itemData = warehouseData.find(
      (data) => data.id.trim() === item.trim()
    );
    if (!itemData || !Array.isArray(itemData.stores)) {
      console.error(
        `Item not found or invalid stores structure: ${JSON.stringify(
          itemData
        )}`
      );
      return null;
    }

    const availableStore = itemData.stores.find(
      (store) => store.physicalQty > 0
    );

    if (availableStore) {
      console.log(availableStore.id);
      return availableStore.id;
    } else {
      console.log("No warehouse with available quantity found.");
      return null;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`Item not found: ${item}`);
      return null; // Return null if item not found
    } else {
      console.error("Error fetching warehouse data:", error);
      throw error; // Throw error for other types of errors
    }
  }
}
async function fetchImage(item) {
  try {
    const response = await fetch(
      `https://extcatalogvw-server.onrender.com/items/Image/${encodeURIComponent(
        item
      )}`
    );

    return response.url;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`Image not found for item ${item}`);
      return null; // Return null for image URL if not found
    } else {
      console.error("Error fetching image:", error);
      throw error; // Throw error for other types of errors
    }
  }
}

function checkItemsEmpty() {
  if (!items || items.length === 0) {
    console.log("Items array is empty.");
    return true;
  } else {
    console.log("Items array is not empty.");
    return false;
  }
}
const port = process.env.PORT || 2999;

app.get("/items", async (req, res) => {
  if (checkItemsEmpty()) {
    await fetchCatalog();
  }
  res.json(items);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
