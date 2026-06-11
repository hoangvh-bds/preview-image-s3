const getBucketContext = () => {
  const bucketMatch = window.location.pathname.match(/^\/s3\/buckets\/([^/?]+)/);
  const regionMatch = window.location.hostname.match(/^([^.]+)\.console\.aws\.amazon\.com$/);

  if (!bucketMatch || !regionMatch) {
    return null;
  }

  return {
    bucketName: decodeURIComponent(bucketMatch[1]),
    region: regionMatch[1],
  };
};

// Prevent injecting twice and only show on S3 bucket pages
if (!document.getElementById("my-extension-btn") && getBucketContext()) {
  const btn = document.createElement("button");
  btn.id = "my-extension-btn";
  btn.innerText = "Preview Images";

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerText = "Loading...";
    
    try {
      await runMyScript();
    } finally {
      btn.disabled = false;
      btn.innerText = "Preview Images";
    }
  });

  document.body.appendChild(btn);
}

const runMyScript = async () => {
  const bucketContext = getBucketContext();
  if (!bucketContext) {
    alert("This page is not a supported S3 bucket page");
    return;
  }

  const { bucketName, region } = bucketContext;

  // Get prefix from URL params if exists
  const urlParams = new URLSearchParams(window.location.search);
  const prefix = urlParams.get("prefix");
  const basePath = prefix ? `${prefix.replace(/\/?$/, "/")}` : "";

  const BASE_URL = prefix
    ? `https://s3.${region}.amazonaws.com/${bucketName}/${basePath}`
    : `https://s3.${region}.amazonaws.com/${bucketName}/`;

  // OLD LOGIC — keep exactly as before
  const listImages = Array.from(
    document.querySelectorAll(
      `a[href*="${bucketName}"] .object-name`,
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
