import { completeExpiredBookings } from "./src/jobs/bookingAutoComplete.job";

completeExpiredBookings()
  .then((r) => {
    console.log("completed:", r.length);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });