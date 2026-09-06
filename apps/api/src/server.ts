import app from "./app";
import { createServer } from "http";
import { initSocket } from "./sockets";
import { initBookingAutoCompleteJob } from "./jobs/bookingAutoComplete.job";

const httpServer = createServer(app);

const bootstrap = async () => {
  await Promise.allSettled([initSocket(httpServer), initBookingAutoCompleteJob()]);

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

bootstrap();