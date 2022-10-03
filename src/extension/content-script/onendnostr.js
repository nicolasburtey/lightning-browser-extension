import browser from "webextension-polyfill";

import getOriginData from "./originData";
import shouldInject from "./shouldInject";

// Nostr calls that can be executed from the Nostr Provider.
// Update when new calls are added
const nostrCalls = [
  "nostr/getPublicKey",
  "nostr/signEvent",
  "nostr/getRelays",  
];

async function init() {
  const inject = await shouldInject();
  if (!inject) {
    return;
  }

  // message listener to listen to inpage webln calls
  // those calls get passed on to the background script
  // (the inpage script can not do that directly, but only the inpage script can make webln available to the page)
  window.addEventListener("message", (ev) => {
    // Only accept messages from the current window
    if (
      ev.source !== window ||
      ev.data.application !== "LBE" ||
      !ev.data.action.startsWith("nostr")
    ) {
      return;
    }

    if (ev.data && !ev.data.response) {

      // limit the calls that can be made from window.nostr
      // only listed calls can be executed
      // if not enabled only enable can be called.
      if (!nostrCalls.includes(ev.data.action)) {
        console.error("Function not available.");
        return;
      }

      const messageWithOrigin = {
        action: `${ev.data.action}`,
        args: ev.data.args,
        application: "LBE",
        public: true, // indicate that this is a public call from the content script
        prompt: true,
        origin: getOriginData(),
      };

      const replyFunction = (response) => {
        window.postMessage(
          {
            application: "LBE",
            response: true,
            data: response,
            action: ev.data.action,
          },
          "*" // TODO use origin
        );
      };

      return browser.runtime
        .sendMessage(messageWithOrigin)
        .then(replyFunction)
        .catch(replyFunction);
    }
  });
}

init();

export {};
