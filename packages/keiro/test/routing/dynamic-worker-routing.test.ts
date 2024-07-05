import { WorkerPoolType } from "../../src/fileSystemRouter";
import { routingTestFixture } from "./routingTestFixture";

describe("Routing with dynamic worker pool", () => {
  routingTestFixture({
    workers: {
      pool: WorkerPoolType.Dynamic,
    },
  });
});
