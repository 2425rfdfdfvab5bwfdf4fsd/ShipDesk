import app from "./app.js";
import { startScheduler } from "./services/reportScheduler.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ShipDesk server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

  if (process.env.NODE_ENV === "production") {
    startScheduler();
  }
});
