const videoOption = document.getElementById('video-option');
const imageOption = document.getElementById('image-option');
const downloadOption = document.querySelectorAll('input[name="download-option"]');
const urlInput = document.getElementById('url-input');
const submitButton = document.getElementById('submit');
const countVideo = document.getElementById('count-videos');
const countImage = document.getElementById('count-images');
const videoContainer = document.getElementById('video-container');
const imageContainer = document.getElementById('image-container');
videoContainer.style.display = 'none';
imageContainer.style.display = 'none';
let selectedMediaType = "video";
let selectedDownloadOption = 1;
videoOption.addEventListener("click", (e) => {
    selectedMediaType = "video";
    videoOption.classList.add("active")
    imageOption.classList.remove("active")
})
imageOption.addEventListener("click", (e) => {
    selectedMediaType = "image";
    imageOption.classList.add("active")
    videoOption.classList.remove("active")
})

downloadOption.forEach(option => {
    option.addEventListener("change", e => {
        selectedDownloadOption = e.target.value;
    })
})
submitButton.addEventListener("click", async (e) => {
    e.preventDefault();
    if (selectedDownloadOption == 2 && selectedMediaType == "video") {
        alert("Chức năng tải nhanh chỉ áp dụng cho hình ảnh");
        return;
    }
    if (!urlInput.value) {
        alert("Please enter a url");
        return;
    }
    await fetchHTML();
})
async function fetchHTML() {
    let preview = true
    if (selectedDownloadOption == 2) {
        preview = false;
    }
    let url = urlInput.value;
    let proxyUrl = `http://localhost:3000/loading-data?url=${encodeURIComponent(url)}&media=${selectedMediaType}&preview=${preview}`;
    
    const filename = decodeURIComponent(url).split('/').at(-2);
    try {
        loading(true)
        let response = await fetch(proxyUrl);
        let mediaDownload = null;
        let mediaData = null;
        if (preview)
            mediaData = await response.json()
        else {
            loading(false)
            mediaDownload = await response.blob();
            const url = window.URL.createObjectURL(mediaDownload);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }
        loading(false)
        console.log(">>> mediaData: ", mediaData);
        if (mediaData.videos || mediaData.images) {
            showMediaFiles(mediaData.videos || mediaData.images)
        }
    } catch (error) {
        loading(false);
        console.error(error);
        alert("Không thể lấy dữ liệu từ trang này.");
    }
}
const showMediaFiles = (Urls) => {
    const notFoundError = document.querySelector(".not-found-data")
    if (Urls.length) {
        notFoundError.classList.add("hidden")
        const count = Urls.length
        let mediaItems = null;
        if (selectedMediaType == "video") {
            countVideo.textContent = count;
            videoContainer.style.display = "flex";
            imageContainer.classList.add("hidden")
            mediaItems = document.querySelector(".video-items")
            mediaItems.innerHTML = ""
            Urls.forEach(mediaUrl => {
                mediaItems.innerHTML += `<video preload loop controls width="500" height="300" class="max-w-[500px] max-h-[300px]" src="${mediaUrl}"></video>`;
            });
        }
        else {
            countImage.te = count;
            imageContainer.style.display = "flex";
            videoContainer.classList.add("hidden")
            mediaItems = document.querySelector(".image-items")
            mediaItems.innerHTML = ""
            Urls.forEach(mediaUrl => {
                mediaItems.innerHTML += `<img src="${mediaUrl}" class="max-w-[500px] max-h-[300px]"/>`;
            });
        }
    } else {
        notFoundError.classList.remove("hidden")
        notFoundError.innerHTML = "Không tìm thấy video nào.";
    }
}
const loading = (status) => {
    const loadingElement = document.getElementById('loading');
    if (status) {
        loadingElement.classList.remove('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }

}