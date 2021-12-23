const BATCH_MS = 200;
const THROTTLE_DELAY_MS = 0;

let count = 0;

const waitIfBeingThrottled = () => {
  const delay = THROTTLE_DELAY_MS * count++;
  return new Promise((res) =>
    setTimeout(() => {
      // try to bring count back to 0
      count = Math.max(count - 1, 0);
      res();
    }, delay)
  );
};

const debounceAndBatch = (fn, wait = BATCH_MS) => {
  let timeout;
  let batchedArgs = [];

  const processUpdate = () => {
    timeout = null;
    fn(batchedArgs);
    batchedArgs = [];
  };

  return (value) => {
    batchedArgs.push(value);
    if (!timeout) timeout = setTimeout(processUpdate, wait);
  };
};

const batchedFetch = (url, options = {}) =>
  new Promise(async (resolve) => {
    await waitIfBeingThrottled();
    foo({
      resolve,
      url,
      options,
    });
  });

const foo = debounceAndBatch(async (requests) => {
  const [{ url, options, resolve, ...rest }] = requests;

  const allRequestBodies = await Promise.all(
    requests.map((request) => request.url.json())
  );

  const response = await fetch(url, {
    ...rest,
    ...options,
    body: JSON.stringify(allRequestBodies),
  });

  const allResults = await response.json();

  allResults.forEach((result, i) => {
    requests[i]?.resolve(new Response(JSON.stringify(result), response));
  });
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // if (url.host.endsWith("solana.com")) {
  if (url.href.includes("data.json")) {
    event.respondWith(
      batchedFetch(event.request).then((response) => {
        console.log({ response });
        return response;
      })
    );
  }
});
