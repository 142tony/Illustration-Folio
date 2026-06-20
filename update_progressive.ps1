$file = 'F:\Illustration Folio\index.html'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Step 1a: Normalize backslashes in img src (image\ → image/)
$content = $content -replace '(<img\b[^>]*?)src="image\\([^"]*)"', '$1src="image/$2"'

# Step 1b: Transform all image/ src to pre_image/ + add data-full-src
$content = $content -replace '(<img\b[^>]*?)src="image/([^"]*)"', '$1src="pre_image/$2" data-full-src="image/$2"'

# Step 2: Replace old script with optimized version
$oldPattern = '(?s)<script>\s*//\s*=+\s*//\s*Progressive Image Loading.*?</script>'
$newScript = @'
<script>
// ============================
// Optimized Progressive Image Loading
// ============================
document.addEventListener('DOMContentLoaded', () => {
const allImages = document.querySelectorAll('img[data-full-src]');
allImages.forEach(img => {
const fullSrc = img.getAttribute('data-full-src');
if (!fullSrc) return;
const swapToFullImage = () => {
const fullImg = new Image();
fullImg.onload = () => {
img.src = fullSrc;
};
fullImg.onerror = () => {
console.warn('無法載入高解析度圖片:', fullSrc);
};
fullImg.src = fullSrc;
};
// 如果低解析度縮圖已快取並載入完成，直接加載大圖；否則等待縮圖載入完再觸發
if (img.complete) {
swapToFullImage();
} else {
img.addEventListener('load', swapToFullImage, { once: true });
}
});
});
</script>
'@
$content = $content -replace $oldPattern, $newScript

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Output 'Progressive image loading update completed.'