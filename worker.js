const BATCH_MS = 200;
const THROTTLE_DELAY_MS = 0;

let throttledWaitingList = 0;

const requestMatcher = ({ url }) => new URL(url).host.endsWith("solana.com");

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

const batchedFetch = (request) =>
  new Promise(async (resolve) => {
    await waitIfBeingThrottled();
    debouncedFetch({ request, resolve });
  });

const debouncedFetch = debounceAndBatch(async (requests) => {
  // inject all request bodies into first request

  const allRequestBodies = await Promise.all(
    requests.map(({ request }) => request.json())
  );

  const { request } = requests[0];

  const response = await fetch(request.url, {
    body: JSON.stringify(allRequestBodies),
    headers: request.headers,
    method: request.method,
  });

  const allResults = await response.json();

  allResults.forEach((result, i) => {
    requests[i].resolve(new Response(JSON.stringify(result), response));
  });
});

self.addEventListener("fetch", (event) => {
  if (requestMatcher(event.request)) {
    event.respondWith(batchedFetch(event.request));
  }
});
