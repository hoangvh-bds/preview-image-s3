// Prevent injecting twice and only show on S3 bucket pages
if (!document.getElementById("my-extension-btn") && 
    window.location.href.startsWith("https://ap-southeast-1.console.aws.amazon.com/s3/buckets/")) {
  const btn = document.createElement("button");
  btn.id = "my-extension-btn";
  btn.innerText = "Run Script";

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerText = "Loading...";
    
    try {
      await runMyScript();
    } finally {
      btn.disabled = false;
      btn.innerText = "Run Script";
    }
  });

  document.body.appendChild(btn);
}

const runMyScript = async () => {
  // Get prefix from URL params if exists
  const urlParams = new URLSearchParams(window.location.search);
  const prefix = urlParams.get("prefix");

  const BASE_URL = prefix
    ? `https://seller-staticfile-blkji.s3.ap-southeast-1.amazonaws.com/${prefix}`
    : "https://seller-staticfile-blkji.s3.ap-southeast-1.amazonaws.com/";

  // OLD LOGIC — keep exactly as before
  const listImages = Array.from(
    document.querySelectorAll(
      'a[href*="seller-staticfile-blkji"] .object-name',
    ),
  ).map((el) => el.textContent.trim());

  // 1️⃣ Keep only real image files (ignore folders, js, html, etc)
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
    ".ico",
    ".avif",
  ];
  const imageFiles = listImages.filter((name) => {
    if (name.endsWith("/")) return false;
    const lowerName = name.toLowerCase();
    return imageExtensions.some((ext) => lowerName.endsWith(ext));
  });

  if (!imageFiles.length) {
    alert("No image files found");
    return;
  }

  // 2️⃣ Convert image → Base64
  const toBase64 = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const images = [];
  for (const name of imageFiles) {
    try {
      images.push({
        name,
        dataUrl: await toBase64(BASE_URL + name),
      });
    } catch (e) {
      console.warn("Failed to load image:", name);
    }
  }

  // 3️⃣ Build HTML
  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>S3 Image Preview</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 16px;
      background: #fafafa;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .item {
      background: #fff;
      border: 1px solid #ddd;
      padding: 8px;
    }
    img {
      width: 100%;
      display: block;
    }
    .name {
      font-size: 12px;
      margin-top: 6px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="grid">
    ${images
      .map(
        (img) => `
      <div class="item">
        <img src="${img.dataUrl}">
        <div class="name">${img.name}</div>
      </div>
    `,
      )
      .join("")}
  </div>
</body>
</html>
`;

  // 4️⃣ Open via Blob (CSP-safe)
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};
