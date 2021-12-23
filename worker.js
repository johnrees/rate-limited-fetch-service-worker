const MS_DELAY = 0;
let count = 0;

const sleep = () => {
  const delay = MS_DELAY * count++;
  return new Promise((res) =>
    setTimeout(() => {
      // try to bring count back to 0
      count = Math.max(count - 1, 0);
      res();
    }, delay)
  );
};

function debounceAgg(fn, wait = 200) {
  let timeout;
  let update = [];

  function processUpdate() {
    timeout = null;
    fn(update);
    update = [];
  }

  return (value) => {
    update.push(value);
    if (timeout == null) timeout = setTimeout(processUpdate, wait);
  };
}

const batchedFetch = (url, options = {}) =>
  new Promise(async (resolve) => {
    await sleep();
    foo({
      resolve,
      url,
      options,
    });
  });

const foo = debounceAgg(async (args) => {
  const body = await Promise.all(args.map((arg) => arg.url.json()));
  const { url, options, resolve, ...rest } = args[0];

  const response = await fetch(url, {
    ...rest,
    ...options,
    body: JSON.stringify(body),
  });
  const results = await response.json();
  console.log({ results });
  results.forEach((result, i) => {
    args[i]?.resolve(new Response(JSON.stringify(result), response));
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
