const MS_DELAY = 100;
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

const rateLimitedFetch = async (url, options = {}) => {
  // wait an amount of time that is based on how many
  // requests are yet to finish
  await sleep();
  return fetch(url, options);
};

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.host.endsWith("solana.com")) {
    event.respondWith(
      rateLimitedFetch(event.request).then((response) => {
        return response;
        // TODO: retry x number of times if !response
      })
    );
  }
});
