/**
 * FairSight Upload Page Logic
 * Handles drag & drop, file validation, CSV parsing, and form submission
 */

document.addEventListener('DOMContentLoaded', function () {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const previewFilename = document.getElementById('preview-filename');
    const previewRows = document.getElementById('preview-rows');
    const previewCols = document.getElementById('preview-cols');
    const previewSize = document.getElementById('preview-size');
    const previewRemove = document.getElementById('preview-remove');
    
    // New Feature elements
    const tablePreviewContainer = document.getElementById('table-preview-container');
    const previewTableHead = document.getElementById('preview-table-head');
    const previewTableBody = document.getElementById('preview-table-body');
    const autoDetectContainer = document.getElementById('auto-detect-container');
    const autoDetectBadges = document.getElementById('auto-detect-badges');

    const columnSelectors = document.getElementById('column-selectors');
    const targetCol = document.getElementById('target-col');
    const sensitiveCol = document.getElementById('sensitive-col');
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnLabel = btnAnalyze ? btnAnalyze.querySelector('.btn-label') : null;
    const uploadForm = document.getElementById('upload-form');
    const demoForm = document.getElementById('demo-form');
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorCard = document.getElementById('error-card');
    const errorMessage = document.getElementById('error-message');

    if (!dropZone) return;

    // --- Drop Zone Events ---
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', e => {
        e.preventDefault(); dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
    });

    // --- File Handling ---
    function handleFile(file) {
        hideError();
        if (!file.name.toLowerCase().endsWith('.csv')) return showError('Invalid file type. Please upload a CSV file.');
        if (file.size > 50 * 1024 * 1024) return showError('File too large. Maximum size is 50MB.');

        previewFilename.textContent = file.name;
        previewSize.textContent = formatFileSize(file.size);
        filePreview.style.display = 'block';

        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;

        const reader = new FileReader();
        reader.onload = e => parseCSVPreview(e.target.result);
        // Only read first chunk for speed on large files
        const slice = file.slice(0, 1024 * 100); 
        reader.readAsText(slice);
        
        // Hide dropzone
        dropZone.style.display = 'none';
        
        if (typeof gsap !== 'undefined') {
            gsap.from(filePreview, { opacity: 0, y: 20, duration: 0.4 });
        }
    }

    function parseCSVPreview(text) {
        const lines = text.trim().split('\n').filter(l => l.trim() !== '');
        const headers = parseCSVLine(lines[0]);
        
        // Count approximate rows based on file size vs chunk if needed, but for now just show chunk rows if small
        previewRows.textContent = (lines.length > 100 ? "100+" : (lines.length - 1)) + " (preview)";
        previewCols.textContent = headers.length;

        // Populate dropdown options
        targetCol.innerHTML = '<option value="">— Choose target column —</option>';
        sensitiveCol.innerHTML = '<option value="">— Choose sensitive attribute —</option>';

        headers.forEach(h => {
            const clean = h.trim().replace(/^["']|["']$/g, '');
            if (clean) {
                targetCol.innerHTML += `<option value="${clean}">${clean}</option>`;
                sensitiveCol.innerHTML += `<option value="${clean}">${clean}</option>`;
            }
        });

        // Build Data Table Preview
        buildTablePreview(headers, lines.slice(1, 6)); // First 5 rows

        // Auto-detect attributes
        detectAttributes(headers);

        columnSelectors.style.display = 'grid';
        if (btnLabel) btnLabel.textContent = 'Select columns below';
        if (typeof gsap !== 'undefined') {
            gsap.from([tablePreviewContainer, autoDetectContainer, columnSelectors], { opacity: 0, y: 20, duration: 0.4, stagger: 0.1 });
        }
    }
    
    function buildTablePreview(headers, dataLines) {
        tablePreviewContainer.style.display = 'block';
        
        // Header
        let theadHtml = '<tr>';
        headers.forEach(h => {
            const clean = h.trim().replace(/^["']|["']$/g, '');
            theadHtml += `<th style="padding: 12px; border-bottom: 1px solid var(--border-light); white-space: nowrap; color: var(--accent-cyan);">${clean}</th>`;
        });
        theadHtml += '</tr>';
        previewTableHead.innerHTML = theadHtml;
        
        // Body
        let tbodyHtml = '';
        dataLines.forEach(line => {
            const row = parseCSVLine(line);
            tbodyHtml += '<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">';
            row.forEach(val => {
                const clean = val.trim().replace(/^["']|["']$/g, '');
                tbodyHtml += `<td style="padding: 10px 12px; white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${clean}">${clean}</td>`;
            });
            tbodyHtml += '</tr>';
        });
        previewTableBody.innerHTML = tbodyHtml;
    }
    
    function detectAttributes(headers) {
        const sensitiveKeywords = ['gender', 'sex', 'race', 'ethnicity', 'age', 'religion', 'disability'];
        const detected = [];
        
        headers.forEach(h => {
            const clean = h.trim().replace(/^["']|["']$/g, '').toLowerCase();
            if (sensitiveKeywords.some(k => clean.includes(k))) {
                detected.push(h.trim().replace(/^["']|["']$/g, ''));
            }
        });
        
        if (detected.length > 0) {
            autoDetectContainer.style.display = 'block';
            let badgesHtml = '';
            detected.forEach(col => {
                badgesHtml += `
                    <div class="detected-badge" onclick="selectSensitive('${col}')" style="cursor: pointer; padding: 6px 12px; border-radius: 20px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.4); color: white; font-size: 13px; font-weight: 500; transition: 0.2s;">
                        <span style="margin-right: 4px;">👤</span> ${col}
                    </div>
                `;
            });
            autoDetectBadges.innerHTML = badgesHtml;
        } else {
            autoDetectContainer.style.display = 'none';
        }
    }
    
    // Global function to be called from badge onclick
    window.selectSensitive = function(colName) {
        if (sensitiveCol) {
            sensitiveCol.value = colName;
            checkColumnsSelected();
            // Highlight selector
            sensitiveCol.parentElement.style.boxShadow = '0 0 15px var(--accent-cyan-glow)';
            setTimeout(() => sensitiveCol.parentElement.style.boxShadow = '', 1000);
        }
    };

    function parseCSVLine(line) {
        const result = []; let current = ''; let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
            else current += char;
        }
        result.push(current); return result;
    }

    // --- Remove File ---
    if (previewRemove) previewRemove.addEventListener('click', e => { e.stopPropagation(); resetUpload(); });

    function resetUpload() {
        fileInput.value = '';
        filePreview.style.display = 'none';
        tablePreviewContainer.style.display = 'none';
        autoDetectContainer.style.display = 'none';
        columnSelectors.style.display = 'none';
        dropZone.style.display = 'block';
        btnAnalyze.disabled = true;
        if (btnLabel) btnLabel.textContent = 'Upload a CSV to begin';
        hideError();
    }

    // --- Column Selection Listeners ---
    function checkColumnsSelected() {
        if (targetCol.value && sensitiveCol.value) {
            btnAnalyze.disabled = false;
            if (btnLabel) btnLabel.textContent = 'Run Bias Audit';
            btnAnalyze.style.boxShadow = '0 0 20px var(--accent-violet-glow)';
        } else {
            btnAnalyze.disabled = true;
            if (btnLabel) btnLabel.textContent = 'Select columns below';
            btnAnalyze.style.boxShadow = 'none';
        }
    }

    if (targetCol) targetCol.addEventListener('change', checkColumnsSelected);
    if (sensitiveCol) sensitiveCol.addEventListener('change', checkColumnsSelected);

    // --- Form Submit ---
    if (uploadForm) uploadForm.addEventListener('submit', e => {
        if (!targetCol.value || !sensitiveCol.value) { e.preventDefault(); return showError('Please select both columns.'); }
        showLoading();
    });
    if (demoForm) demoForm.addEventListener('submit', () => showLoading());

    function showLoading() { if (loadingOverlay) loadingOverlay.style.display = 'flex'; }
    function showError(msg) {
        if (errorCard && errorMessage) {
            errorMessage.textContent = msg; errorCard.style.display = 'flex';
            if (typeof gsap !== 'undefined') gsap.from(errorCard, { opacity: 0, y: 10 });
        }
    }
    function hideError() { if (errorCard) errorCard.style.display = 'none'; }
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
});
