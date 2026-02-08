import { jsPDF } from "jspdf";

export default function PDFReport({ breed, info, image }) {
  const download = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    
    // ==========================================
    // 🎨 THEME COLORS
    // ==========================================
    const PRIMARY_COLOR = [79, 70, 229];    // Indigo-600
    const SECONDARY_COLOR = [49, 46, 129];  // Indigo-900 
    const ACCENT_COLOR = [225, 29, 72];     // Rose-600
    const TABLE_ROW_COLOR = [238, 242, 255];// Indigo-50
    const WHITE = [255, 255, 255];
    const GRAY_TEXT = [100, 116, 139];      // Slate-500
    const PROGRESS_BAR_GREEN = [34, 197, 94]; // Green-500

    // Icon Colors (Matching your React UI)
    const ICON_BLUE = [59, 130, 246];   // Milk
    const ICON_YELLOW = [234, 179, 8];  // Fat
    const ICON_ORANGE = [249, 115, 22]; // Climate
    const ICON_GREEN = [34, 197, 94];   // Market

    // ==========================================
    // 🖌️ HELPER: VECTOR ICON DRAWER
    // ==========================================
    const drawIcon = (type, x, y) => {
        doc.setLineWidth(0.5);
        
        if (type === "milk") {
            // Droplet (Blue)
            doc.setFillColor(...ICON_BLUE);
            doc.setDrawColor(...ICON_BLUE);
            // Draw a teardrop shape using lines and circle
            doc.circle(x + 2, y + 3, 1.5, "F"); 
            doc.triangle(x + 0.5, y + 2.5, x + 3.5, y + 2.5, x + 2, y, "F");
        } 
        else if (type === "fat") {
            // Activity/ZigZag (Yellow)
            doc.setDrawColor(...ICON_YELLOW);
            doc.setLineWidth(0.8);
            doc.lines([[1.5, -1.5], [1.5, 3], [1.5, -3]], x, y + 3); 
            // Simple Circle wrapper
            doc.setDrawColor(...ICON_YELLOW);
            doc.setLineWidth(0.2);
            doc.circle(x + 2, y + 2, 2.5, "S");
        }
        else if (type === "climate") {
            // Thermometer (Orange)
            doc.setFillColor(...ICON_ORANGE);
            doc.setDrawColor(...ICON_ORANGE);
            // Bulb
            doc.circle(x + 2, y + 3.5, 1.2, "F");
            // Stem
            doc.rect(x + 1.5, y, 1, 3.5, "F");
        }
        else if (type === "market") {
            // Banknote (Green)
            doc.setFillColor(...ICON_GREEN);
            doc.roundedRect(x, y + 1, 5, 3, 0.5, 0.5, "F");
            doc.setFillColor(255, 255, 255);
            doc.circle(x + 2.5, y + 2.5, 0.8, "F"); // Center white dot
        }
    };

    // =========================
    // 1. HEADER BANNER
    // =========================
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, 210, 40, "F"); 

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text("Gau-Raksha AI Report", 15, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(224, 231, 255); 
    doc.text("Indigenous Cattle Identification & Analysis", 15, 28);

    const dateStr = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text(`Generated: ${dateStr}`, 195, 20, { align: "right" });

    let y = 55;

    // =========================
    // 2. IMAGE SECTION
    // =========================
    if (image) {
      try {
        const imgData = await fileToBase64(image);
        doc.setDrawColor(...PRIMARY_COLOR);
        doc.setLineWidth(0.5);
        doc.rect(14, y - 1, 62, 47); 
        doc.addImage(imgData, "JPEG", 15, y, 60, 45); 
      } catch (err) {
        console.error("Image error", err);
      }
    } else {
        doc.setDrawColor(200);
        doc.setFillColor(245);
        doc.rect(15, y, 60, 45, "FD");
        doc.text("No Image", 45, y + 25, { align: "center" });
    }

    // =========================
    // 3. MAIN INFO CARD
    // =========================
    let infoX = 85;
    let infoY = y + 5;

    doc.setFontSize(10);
    doc.setTextColor(...GRAY_TEXT);
    doc.text("IDENTIFIED BREED", infoX, infoY);

    infoY += 10;
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ACCENT_COLOR);
    doc.text(breed, infoX, infoY);

    infoY += 12;
    doc.setFontSize(10);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.setFont("helvetica", "bold");
    doc.text("Confidence Score", infoX, infoY); 

    infoY += 4;
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setFillColor(224, 231, 255); 
    doc.roundedRect(infoX, infoY, 100, 6, 2, 2, "FD"); 
    
    doc.setFillColor(...PROGRESS_BAR_GREEN);
    const confidenceWidth = ((info.confidence || 0) / 100) * 100;
    doc.roundedRect(infoX, infoY, confidenceWidth, 6, 2, 2, "F"); 

    doc.setFontSize(9);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(`${info.confidence ? info.confidence.toFixed(1) : "0"}% Match`, infoX + 105, infoY + 4.5);

    y += 60;

    // =========================
    // 4. DESCRIPTION BOX
    // =========================
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text("Breed Description", 15, y);
    y += 6;

    const descriptionText = info.description || "Description not available for this breed.";
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitDesc = doc.splitTextToSize(descriptionText, 170);
    const boxHeight = (splitDesc.length * 5) + 12;

    doc.setFillColor(...TABLE_ROW_COLOR); 
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(0.1);
    doc.roundedRect(15, y, 180, boxHeight, 3, 3, "FD");

    doc.setTextColor(60);
    doc.text(splitDesc, 20, y + 8);

    y += boxHeight + 15;

    // =========================
    // 5. DATA TABLE (With Icons)
    // =========================
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text("Key Characteristics", 15, y);
    y += 8;

    const startY = y;
    const rowHeight = 14; // Increased height slightly for icons
    const colWidth1 = 70;  
    
    const cleanMarketValue = (val) => {
        if (!val) return "N/A";
        return String(val).replace(/₹/g, "").trim(); 
    };

    // Data rows with types for icons
    const rows = [
      { label: "Milk Yield", value: info.milk_yield || "N/A", type: "milk" },
      { label: "Fat Percentage", value: info.fat_percentage || "N/A", type: "fat" },
      { label: "Climate Tolerance", value: info.climate_tolerance || "N/A", type: "climate" },
      { label: "Market Value (in INR)", value: cleanMarketValue(info.market_value), type: "market" }
    ];

    doc.setFontSize(11);
    doc.setLineWidth(0.1);

    rows.forEach((row, index) => {
        const currentY = startY + (index * rowHeight);

        // Zebra Striping
        if (index % 2 === 0) {
            doc.setFillColor(...WHITE); 
        } else {
            doc.setFillColor(...TABLE_ROW_COLOR); 
        }
        
        doc.rect(15, currentY, 180, rowHeight, "F");

        // --- DRAW ICON ---
        // Draw icon at x=20, centered vertically in row
        drawIcon(row.type, 20, currentY + 4);

        // Label Text (Shifted to make room for icon)
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...SECONDARY_COLOR);
        doc.text(row.label, 30, currentY + 9); // X moved from 20 to 30

        // Value Text
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50);
        doc.text(String(row.value), 20 + colWidth1, currentY + 9);

        // Bottom Line
        doc.setDrawColor(226, 232, 240); 
        doc.line(15, currentY + rowHeight, 195, currentY + rowHeight);
    });

    // Outer Border
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.rect(15, startY, 180, rows.length * rowHeight);

    // =========================
    // 6. FOOTER
    // =========================
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFillColor(...SECONDARY_COLOR);
    doc.rect(0, pageHeight - 15, 210, 15, "F");

    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text("Report Generated by Gau-Raksha AI", 105, pageHeight - 6, { align: "center" });

    doc.save(`${breed}_GauRaksha_Report.pdf`);
  };

  return (
    <button
      onClick={download}
      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-900/20 flex items-center justify-center gap-2"
    >
      <span>📄</span> Download Professional Report
    </button>
  );
}

// =========================
// Helper: Image → Base64
// =========================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) reject("No file provided");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}