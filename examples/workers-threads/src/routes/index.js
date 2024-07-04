import { defineHandler } from "keiro";

/**
 * @param {number} count
 * @returns {Promise<string>}
 */
async function doWork(count) {
  let result = "";

  for (let i = 0; i < count; i++) {
    result += `${i % 10}`;
  }

  return result;
}

export default defineHandler(async () => {
  const result = await doWork(1000_000);
  return new Response(result);
});
