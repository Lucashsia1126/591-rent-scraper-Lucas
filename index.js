const config = require("./config.json");
const crawlOnePage = require("./crawler/crawlOnePage");
const { loadHistory, saveHistory } = require("./utils/history");
const { sendDiscordNotification } = require("./utils/notify");

const intervalMs = config.intervalMinutes * 60 * 1000;

async function checkForNewListings() {
  const history = loadHistory();
  for (let i = 0; i < history.length; i++) {
    const now = new Date().toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });
    const url = config.urls[i];
    const [city, data] = await crawlOnePage(url);

    // 將上一次獲取的物件連結放到一個陣列中
    const oldLinks = history[i]?.map((item) => item.link) || [];

    // 將新資料與舊資料比對，找出剛出現的新物件
    const newItems = data.filter((item) => !oldLinks.includes(item.link));

    if (newItems.length > 0) {
      // 沒有舊物件的紀錄，表示此 url 為新加入的搜尋條件，下一次執行才會開始比較有沒有新物件
      if (oldLinks.length === 0) {
        history[i] = data;
        continue;
      }
      console.log(`[${now}] ${city} 新增 ${newItems.length} 筆新房源`);
      await sendDiscordNotification(newItems, city);
    } else {
      console.log(`[${now}] ${city} 沒有新資料`);
    }

    history[i] = data;
  }
  saveHistory(history);
}

// setInterval(checkForNewListings, intervalMs);
checkForNewListings();
