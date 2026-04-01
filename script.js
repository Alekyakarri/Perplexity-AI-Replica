document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");
    const suggestionsContainer = document.querySelector(".suggestions-container");
    const responseContainer = document.getElementById("response-container");
    const responseText = document.getElementById("response-text");
    const loadingIndicators = document.getElementById("loading-indicators");

    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input");
    const fileNameDisplay = document.getElementById("file-name-display");

    // Handle file upload button click
    uploadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            fileNameDisplay.textContent = fileInput.files[0].name;
            fileNameDisplay.title = fileInput.files[0].name; // tooltip
        } else {
            fileNameDisplay.textContent = "";
            fileNameDisplay.title = "";
        }
    });

    const submitQuery = async (query) => {
        if (!query.trim()) return;

        // Hide suggestions, show response container
        suggestionsContainer.style.display = "none";
        responseContainer.style.display = "block";
        
        // Setup initial loading state
        let attachmentInfo = "";
        if (fileInput.files.length > 0) {
            attachmentInfo = `<br><small style="color:#0b8489;">[Attached: ${fileInput.files[0].name}]</small>`;
        }
        responseText.innerHTML = `<strong>Query:</strong> ${query}${attachmentInfo}<br><br>`;
        loadingIndicators.style.display = "flex";

        try {
            // Use FormData for file upload instead of JSON
            const formData = new FormData();
            formData.append("message", query);
            
            if (fileInput.files.length > 0) {
                formData.append("file", fileInput.files[0]);
            }

            const res = await fetch("/api/chat", {
                method: "POST",
                body: formData // Note: Do not set Content-Type header when using FormData
            });

            const data = await res.json();
            
            // Hide loading
            loadingIndicators.style.display = "none";

            if (data.response) {
                // Formatting simple markdown: bold, lists, lines
                let formattedText = data.response
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
                responseText.innerHTML += `<strong>Alekya:</strong><br>${formattedText}`;
                
                // Clear the attached file after a successful query
                fileInput.value = "";
                fileNameDisplay.textContent = "";
            } else {
                responseText.innerHTML += `<em>Error: ${data.error || "An error occurred."}</em>`;
            }
        } catch (error) {
            loadingIndicators.style.display = "none";
            responseText.innerHTML += `<em>Failed to connect to the server. ${error.message}</em>`;
        }
    };

    // Handle pressing Enter
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const query = searchInput.value;
            submitQuery(query);
            searchInput.value = "";
        }
    });

    // Make suggestion chips clickable
    const suggestions = document.querySelectorAll(".suggestion-list-item, .chip");
    suggestions.forEach(suggestion => {
        suggestion.addEventListener("click", (e) => {
            e.preventDefault();
            const query = e.target.innerText.trim();
            submitQuery(query);
        });
    });
});
