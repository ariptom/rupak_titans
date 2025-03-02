const SUPABASE_URL = "https://qoavukwvllqyqkcyzgos.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvYXZ1a3d2bGxxeXFrY3l6Z29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4Mzk3MTgsImV4cCI6MjA1NjQxNTcxOH0.8yYt5GZEHBMiTW8AGWCvfzbk1iKNgffdD1J-elFyrew";
const BUCKET_NAME = "pdf-files";

// ✅ Initialize Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let pdfDoc = null, scale = 1.0, currentPage = 1;

async function listFiles() {
    const { data, error } = await supabaseClient.storage.from(BUCKET_NAME).list();
    if (error) {
        console.error("Error listing files:", error);
        return;
    }

    const fileSelect = document.getElementById("fileSelect");
    fileSelect.innerHTML = "<option value=''>-- Select a PDF --</option>";

    data.forEach(file => {
        const option = document.createElement("option");
        option.value = file.name;
        option.textContent = file.name;
        fileSelect.appendChild(option);
    });
}

async function loadPDF() {
    const fileName = document.getElementById("fileSelect").value;
    if (!fileName) return;

    // ✅ Fetch public URL correctly
    const { data, error } = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    if (error) {
        console.error("Error fetching public URL:", error);
        return;
    }

    const pdfUrl = data.publicUrl;

    pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
        pdfDoc = pdf;
        currentPage = 1; // ✅ Ensure the first page is shown
        renderPDF();
    }).catch(err => console.error("Error loading PDF:", err));
}

function renderPDF() {
    if (!pdfDoc) return;

    pdfDoc.getPage(currentPage).then(page => {
        const canvas = document.getElementById("pdfCanvas");
        const ctx = canvas.getContext("2d");

        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        page.render({ canvasContext: ctx, viewport });

        // ✅ Update the page number *AFTER* the page renders
        document.getElementById("pageNumber").textContent = `Page ${currentPage} of ${pdfDoc.numPages}`;
    }).catch(err => console.error("Error rendering PDF:", err));
}

// ✅ Navigate to Next Page
function nextPage() {
    if (currentPage < pdfDoc.numPages) {
        currentPage++; 
        renderPDF();
    }
}

// ✅ Navigate to Previous Page
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPDF();
    }
}

function zoomIn() {
    scale += 0.2;
    renderPDF();
}

function zoomOut() {
    scale = Math.max(0.5, scale - 0.2);
    renderPDF();
}

// ✅ Detect swipe gestures for page navigation
let touchStartX = 0;
let touchEndX = 0;

document.getElementById("pdfCanvas").addEventListener("touchstart", e => {
    touchStartX = e.touches[0].clientX;
});

document.getElementById("pdfCanvas").addEventListener("touchend", e => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
});

document.getElementById("pdfCanvas").addEventListener("mousedown", e => {
    touchStartX = e.clientX;
});

document.getElementById("pdfCanvas").addEventListener("mouseup", e => {
    touchEndX = e.clientX;
    handleSwipe();
});

function handleSwipe() {
    let diff = touchEndX - touchStartX;
    if (diff > 50) prevPage(); // Swipe right → Previous page
    else if (diff < -50) nextPage(); // Swipe left → Next page
}

// ✅ Load file list on page load
listFiles();
