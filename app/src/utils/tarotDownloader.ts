import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { HttpsProxyAgent } from "hpagent";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "https://en.wikipedia.org/w/api.php";
const PAGE_TITLE = process.env.PAGE_TITLE || "wiki_source";
const PROXY_URL = process.env.PROXY_URL || "http://127.0.0.1:7890";
const SAVE_DIR = "../assets/tarot_images";

const agent = new HttpsProxyAgent({
  keepAlive: true,
  proxy: PROXY_URL,
});

// https://en.wikipedia.org/robots.txt
const headers = {
  "User-Agent": "TarotDownloader/1.0 (rrrico@foxmail.com)",
};

async function getTarotImages() {
  try {
    const response = await axios.get(API_URL, {
      headers,
      httpsAgent: agent,
      params: {
        action: "query",
        titles: PAGE_TITLE,
        prop: "images",
        format: "json",
        imlimit: "100",
      },
    });

    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0]!;
    const images = pages[pageId].images;

    if (!images) {
      console.log("No images found on the page.");
      return;
    }

    await fs.ensureDir(SAVE_DIR);

    for (const img of images) {
      const fileName = img.title;

      // filter
      if (!/\.(jpg|jpeg|png)$/i.test(fileName)) continue;

      const infoResponse = await axios.get(API_URL, {
        headers,
        httpsAgent: agent,
        params: {
          action: "query",
          titles: fileName,
          prop: "imageinfo",
          iiprop: "url|extmetadata",
          format: "json",
        },
      });

      const imgPages = infoResponse.data.query.pages;
      const imgId = Object.keys(imgPages)[0]!;
      const info = imgPages[imgId].imageinfo[0];

      if (info) {
        const downloadUrl = info.url; // original image URL

        const altName =
          info.extmetadata?.ObjectName?.value || fileName.replace("File:", "");
        const cleanName = altName.replace(/[\\/:*?"<>|]/g, "_").trim();
        const filePath = path.join(SAVE_DIR, `${cleanName}.jpg`);

        console.log(`downloading: ${cleanName}...`);
        await downloadFile(downloadUrl, filePath);
      }
    }
    console.log("complete!");
  } catch (error) {
    console.error("error:", error);
  }
}

async function downloadFile(url: string, filePath: string) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    headers,
    httpsAgent: agent,
  });
  response.data.pipe(writer);
  return new Promise<void>((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

getTarotImages();
