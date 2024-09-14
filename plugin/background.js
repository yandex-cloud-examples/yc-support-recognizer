let isChrome = (typeof (browser) == 'undefined');
if (typeof (chrome) != 'undefined') browser = chrome;
browser.contextMenus.create({
  id: "do-vision",
  title: "Recognize",
  contexts: ["image"],
  documentUrlPatterns: [
    "*://st.yandex-team.ru/*",
    "*://backoffice.cloud.yandex.ru/chats*",
    '*://backoffice.yandex.cloud/chats-api/*',
    "*://chats-api-prod-user-attachments.storage.yandexcloud.net/*"
  ]
},
  // See https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/#event-pages-and-backward-compatibility
  // for information on the purpose of this error capture.
  () => void browser.runtime.lastError,
)

browser.contextMenus.onClicked.addListener(async function (info, tab) {
  if (info.menuItemId === "do-vision") {
    //fetching image:
    imgURL = info.srcUrl;
    //permission check
    let rq = {};
    if (isChrome) {
      let rq = {origins: ["*://recognizr.yandex-team.ru/*"]}
    } else {
      //FireFox hell
      let rq = {origins: [
        "*://recognizr.yandex-team.ru/*",
        "*://st.yandex-team.ru/*",
        "*://storage.mds.yandex.net/*",
        "*://chats-api-prod-user-attachments.storage.yandexcloud.net/*",
        "*://backoffice.cloud.yandex.ru/*",
        "*://backoffice.yandex.cloud/*"
      ]};
      let host = (new URL(imgURL)).host;
      rq.origins.push(`*://${host}/*`)
    }
    if (!await browser.permissions.request(rq)) return;
    //https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/host_permissions
    console.log('URL: ', imgURL);
    let srcImg = await fetch(imgURL);
    let blob = await srcImg.blob();
    let fr = new FileReader;
    let p = new Promise((resolve, reject) => {
      fr.onload = function () { resolve(this.result) }
    })
    fr.readAsBinaryString(blob);
    let imgData = btoa(await p);
    console.log(imgData.slice(0, 100));

    let fr2 = new FileReader;
    let p2 = new Promise((resolve, reject) => {
      fr2.onload = function () { resolve(this.result) }
    })
    fr2.readAsDataURL(blob);
    let imgData2 = await p2;
    console.log(imgData2.slice(0, 100));

    //new tab handler
    let tabHandler = function (tabId, ChangeInfo, tab) {
      if (ChangeInfo.status && ChangeInfo.status == "complete") {
        browser.tabs.onUpdated.removeListener(tabHandler);
        //INJECT!11
        let ExecScrObj = {
          func: (p, d) => {
            console.log('param:', p.slice(0, 100));
            document.getElementById("img").src = d;
            let w = window.wrappedJSObject || window;
            w.document.r.recognize(p, 'plugin1.4');
          },
          args: [imgData, imgData2],
          target: { tabId: tabId }
        }
        if (isChrome) ExecScrObj.world = "MAIN";
        browser.scripting.executeScript(ExecScrObj);
        //injected
      }
    };
    //TODO: index: currentTab+1; currentTab = (await browser.tabs.getCurrent()).index;
    browser.tabs.onUpdated.addListener(tabHandler);
    let newtab = await browser.tabs.create({ url: "https://recognizr.yandex-team.ru/" });
  }
});

