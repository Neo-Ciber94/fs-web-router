import { WorkerPoolType } from "../../src/fileSystemRouter";
import { routingTestFixture } from "./routingTestFixture";

describe("Routing with fixed worker pool", () => {
  routingTestFixture({
    workers: {
      pool: WorkerPoolType.Fixed,
    },
  });
});
