const path = require('path')
const axios = require('axios');
const AdmZip = require("adm-zip");
const cheerio = require('cheerio');
var querystring = require("querystring");
module.exports = class LoadDataService {
    static async loadData(req, res) {
        const { url, media, preview } = req.query;

        if (!url || !media) {
            return res.status(400).send({ error: "Thiếu thông tin cần thiết" });
        }

        if (media === "video") {
            return await loadVideos(url, res);
        } else if (media === "image") {
            return await loadImages(url, preview, res);
        } else {
            return res.status(400).send({ error: "Media không hợp lệ" });
        }
    }
};

const loadVideos = async (url, res) => {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const regex = /https?:\/\/[^\s'"]+\.mp4/g;
        const matches = html.match(regex);

        if (!matches) {
            return res.status(400).send({ error: "Không tìm thấy video nào trong HTML" });
        }
        // Loại bỏ trùng lặp
        const uniqueLinks = [...new Set(matches)];
        return res.status(200).send({ videos: uniqueLinks, error: null });
    } catch (error) {
        return res.status(500).send({ error: "Lỗi khi tải video", details: error.message });
    }
};

const loadImages = async (url, preview, res) => {
    try {
        // Lấy HTML từ URL
        const response = await axios.get(url);
        let html = response.data;

        // Load HTML vào Cheerio
        let $ = cheerio.load(html, { decodeEntities: false });

        $("a").remove(); // Xóa toàn bộ thẻ a và nội dung bên trong
        html = $.html();

        const regex = /https?:\/\/[^\s'"]+\.(jpg|jpeg|png|gif)/g;
        const matches = html.match(regex);
        if (!matches) {
            return res.status(400).send({ error: "Không tìm thấy ảnh nào trong HTML" });
        }
        const uniqueLinks = [...new Set(matches)];
        if (preview == "true") {
            return res.status(200).send({ images: uniqueLinks, error: null });
        }
        const zipName = querystring.unescape(url.split("/").at(-2))
        return await downloadImagesAsZip(uniqueLinks, res, sanitizeFileName(zipName));
    } catch (error) {
        return res.status(500).send({ error: "Lỗi khi tải ảnh", details: error.message });
    }
};



const downloadImagesAsZip = async (imageLinks, res, zipName) => {
    try {
        console.log(`🚀 Bắt đầu tải ${imageLinks.length} ảnh...`);
        console.log(zipName);
        res.setHeader("Content-Disposition", ` filename*=UTF-8''${zipName}.zip`);
        res.setHeader("Content-Type", "application/zip");

        const zip = new AdmZip();
        const pLimit = (await import("p-limit")).default;
        const limit = pLimit(5); // Giới hạn tối đa 5 request cùng lúc

        const downloadImage = async (imageUrl) => {
            try {
                const fileName = path.basename(new URL(imageUrl).pathname);
                const decodeFileName =  querystring.unescape(fileName);
                const response = await axios({
                    url: imageUrl,
                    method: "GET",
                    responseType: "arraybuffer",
                    timeout: 30000, // 30 giây timeout
                });

                // Lưu vào ZIP
                zip.addFile(decodeFileName, response.data);
                console.log(`✅ Đã thêm ảnh vào ZIP: ${decodeFileName}`);
            } catch (err) {
                console.error(`⚠️ Lỗi tải ảnh ${imageUrl}:`, err.message);
            }
        };

        // Chạy song song với giới hạn
        await Promise.all(imageLinks.map((link) => limit(() => downloadImage(link))));

        console.log("📦 Hoàn tất tải ảnh, đang nén ZIP...");

        // Tạo buffer và gửi về client
        const zipBuffer = zip.toBuffer();
        res.send(zipBuffer);

        console.log("🚀 Gửi file ZIP thành công!");
    } catch (error) {
        console.error("❌ Lỗi khi tạo ZIP:", error.message);
        res.status(500).json({ error: "Không thể tải ảnh", details: error.message });
    }
};
const sanitizeFileName = (name) => {
    return name.normalize("NFD") // tách dấu tiếng Việt
               .replace(/[\u0300-\u036f]/g, "") // loại dấu
               .replace(/[^\w\-\.]+/g, '_'); // thay ký tự không hợp lệ bằng _
  };
  