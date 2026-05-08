fetch("setting.json?_=" + Date.now())
  .then(res => res.json())
  .then(config => {
    if (!config.websiteActive) {
      document.body.innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white text-center p-6">
            <div class="glass rounded-2xl p-8 max-w-md shadow-lg">
                <h1 class="text-3xl font-bold mb-4">Website Unavailable</h1>
                <p class="text-gray-300 mb-6">${config.websiteReason}</p>
            </div>
        </div>
      `;
    }
  });
