import { CATEGORY_UIDs } from "../bootstrapping.js";
import cache from "../utils/cache.js";
import { init } from "../services/uidService.js";

export default async function initializeApp() {
  console.log("//// -- App initialization commence -- ////");
  console.log("// -- Init cache ");
  await Promise.all(
    CATEGORY_UIDs.map(async (uid) => {
      return await cache.allDescendantsOf(uid);
    }),
  );
  console.log("// -- Init uid service ");
  await init();

  console.log("//// -- App initialization complete -- ////");
}
