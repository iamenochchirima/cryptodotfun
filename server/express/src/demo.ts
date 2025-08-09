// src/demo.ts
import { getStatus } from "./index";

console.log("Starting demo...");

getStatus("local")
  .then((status) => {
    console.log("Demo completed successfully:", status);
  })
  .catch((error) => {
    console.error("Error during demo:", error);
  });
