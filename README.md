# Rate Limited Fetch Service Worker

This intercepts requests (currently to devnet.solana.com) and tries to enforce a 100ms delay between them, so that they do not get rate limited.

You can toggle whether or not it's running in the Application tab of the browser.

![](network-tab.png)
