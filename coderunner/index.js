import piston from "piston-client";


const options = {
  server: "https://emkc.org",
  requirements: ["numpy"]
};

(async () => {

  const client = piston(options);

  const runtimes = await client.runtimes();

  console.log("Hi world")
  const result1 = await client.execute('python', 'print("Hello World!")');
  console.log(result1);

  // Example with numpy
  console.log("Example with numpy")
  const result2 = await client.execute('python', `
import numpy as np
a = np.array([1, 2, 3])
print(a)
    `);
  console.log(result2);

  // Example that prints and then throws an error
  console.log("Example that prints and then throws an error")
  const result3 = await client.execute('python', `
print("Hello World!")
raise Exception("This is an error!")
    `);
  console.log(result3);

  // Example that waits for 5 seconds
  // NOTE: as you can see, the public API kills the process after 3 seconds.
  console.log("Example prints something every second for 5 seconds")
  const result4 = await client.execute('python', `
import time
for i in range(5):
    print(f"Hello World! {i}")
    time.sleep(1)
    `);
  console.log(result4);


  // Overextending our number of requests per second by making too many requests in a second
  console.log("Overextending our number of requests per second by making too many requests in a second")
  const promises = [];
  for (let i = 0; i < 6; i++) {
    promises.push(client.execute('python', 'print("Hello World!")'));
  }
  const results = await Promise.all(promises);
  console.log(results);
})();