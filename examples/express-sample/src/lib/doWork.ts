export async function doWork(count: number) {
  let contents = "";

  for (let i = 0; i < count; i++) {
    contents += `${i}`;
  }

  return contents;
}
