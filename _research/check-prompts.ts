import { showcaseChain } from "./src/engine/showcase";
import { promptKey } from "./server/lux3d";
const chain = showcaseChain("cup");
for (const n of chain) {
  console.log(`G${n.generation} ${n.mutation?.title} | ${n.mutation?.operator} | key=${promptKey(n.prompt)}`);
  console.log(n.prompt.split("\n").slice(1,4).join("\n"));
  console.log("---");
}
