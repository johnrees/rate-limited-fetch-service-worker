const BATCH_MS = 200;
const THROTTLE_DELAY_MS = 0;

let throttledWaitingList = 0;

const requestMatcher = ({ url }) =>
  // new URL(url).host.endsWith("solana.com")
  new URL(url).href.includes("data.json");

const waitIfBeingThrottled = () => {
  const delay = THROTTLE_DELAY_MS * throttledWaitingList++;
  return new Promise((res) =>
    setTimeout(() => {
      // try to bring throttledWaitingList back to 0
      throttledWaitingList = Math.max(throttledWaitingList - 1, 0);
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

const batchedFetch = (url) =>
  new Promise(async (resolve) => {
    await waitIfBeingThrottled();
    debouncedFetch({
      url,
      resolve,
    });
  });

const debouncedFetch = debounceAndBatch(async (requests) => {
  const [{ url }] = requests;

  const allRequestBodies = await Promise.all(
    requests.map((request) => request.url.json())
  );

  const response = await fetch(url, {
    body: JSON.stringify(allRequestBodies),
  });

  const allResults = await response.json();

  allResults.forEach((result, i) => {
    requests[i]?.resolve(new Response(JSON.stringify(result), response));
  });
});

self.addEventListener("fetch", (event) => {
  if (requestMatcher(event.request)) {
    event.respondWith(batchedFetch(event.request));
  }
});
