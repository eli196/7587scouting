var resultsFile = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="libraries/html5-qrcode.min.js"></script>
    <title>Team 7587 Scouting<\/title>
    <style>
        :root {
            --bg: #f4f4f9;
            --c-bg: #fff;
            --txt: #333;
            --acc: #3498db;
            --sec: #8e44ad;
            --dan: #e74c3c;
            --suc: #2ecc71;
            --brd: #ccc;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg);
            color: var(--txt);
            padding: 15px;
            margin: 0;
        }

        .container {
            max-width: 650px;
            margin: 10px auto;
            background: var(--c-bg);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid var(--brd);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .header-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .report-count {
            background: var(--acc);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
        }

        .report-item {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 10px;
            overflow: hidden;
            background: #fff;
            position: relative;
        }

        .report-summary {
            padding: 15px;
            padding-right: 80px;
            \/* Space for delete button *\/
            background: #fff;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            font-size: 1.1em;
        }

        .report-details {
            display: none;
            padding: 15px;
            background: #fdfdfd;
            border-top: 1px solid #eee;
        }

        .report-item.expanded .report-details {
            display: block;
            border-left: 5px solid var(--acc);
        }

        .btn-delete {
            position: absolute;
            top: 12px;
            right: 12px;
            background: #fff;
            color: var(--dan);
            border: 1px solid var(--dan);
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 0.75em;
            z-index: 5;
        }

        .btn-delete:hover {
            background: var(--dan);
            color: white;
        }

        .data-line {
            display: flex;
            justify-content: space-between;
            font-size: 0.9em;
            padding: 6px 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .label {
            color: #666;
            flex: 1;
        }

        .value {
            font-weight: bold;
            text-align: right;
            flex: 1;
        }

        #scanner-view {
            display: none;
        }

        #reader {
            width: 100%;
            border-radius: 8px;
            background: #000;
        }

        .button-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 15px;
        }

        .btn {
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            text-align: center;
        }

        .btn-scan {
            background: var(--acc);
        }

        .btn-upload {
            background: var(--sec);
        }

        .btn-export {
            background: var(--suc);
            margin-bottom: 10px;
            display: none;
        }

        .btn-cancel {
            background: #95a5a6;
            margin-top: 15px;
        }
    <\/style>
<\/head>

<body>
    <div class="container">
        <div id="home-screen">
            <div class="header-flex">
                <h2>Match Reports<\/h2>
                <span class="report-count" id="count-badge">0 Scanned<\/span>
            <\/div>

            <button class="btn btn-export" id="btn-export" onclick="exportToHTMLFile()">⤓ Export<\/button>

            <div id="report-list">
                <p style="text-align:center; color:#999; margin:40px 0;">No reports scanned yet.<\/p>
            <\/div>

            <div class="button-group">
                <button class="btn btn-scan" onclick="showScanner()">📷 Scan via Camera<\/button>
                <button class="btn btn-upload" onclick="triggerFileUpload()">📁 Upload Screenshot<\/button>
            <\/div>

            <input type="file" id="qr-input-file" accept="image\/*" style="display: none"
                onchange="handleFileUpload(this)">
        <\/div>

        <div id="scanner-view">
            <h2>Scan QR Code<\/h2>
            <div id="reader"><\/div>
            <button class="btn btn-cancel" onclick="hideScanner()">Cancel<\/button>
        <\/div>
    <\/div>

    <script>
        const html5QrCode = new Html5Qrcode("reader");
        let allReports = [];

        const options = {
            yes_no: ["-", "Yes", "No"],
            pos: ["-", "Right", "Hub", "Left"],
            hang: ["-", "1", "2", "3", "N\/A"],
            role: ["-", "defense", "collect fuel", "climb", "none"],
            def_target: ["-", "opposing hub", "zone"],
            def_zone: ["-", "trench", "bump", "both"],
            climb: ["-", "1", "2", "3", "none"],
            rp_type: ["-", "ENERGIZED", "SUPERCHARGED"],
            strengths: ["-", "Fuel scoring", "hanging", "defense", "fuel collection", "None"]
        };

        const schema = {
            header: [
                { k: "Scout Name", type: 'text' }, { k: "Team #", type: 'text' },
                { k: "Preload", type: 'select', map: options.yes_no }, { k: "Start Pos", type: 'select', map: options.pos }
            ],
            auto: [
                { k: "Auto Moved", type: 'select', map: options.yes_no }, { k: "Auto Hub", type: 'text' },
                { k: "Auto Cycle", type: 'text' }, { k: "Auto Hang", type: 'select', map: options.hang },
                { k: "Auto Most", type: 'select', map: options.yes_no }
            ],
            trans: [
                { k: "Trans Moved", type: 'select', map: options.yes_no }, { k: "Trans Hub", type: 'text' },
                { k: "Trans Cycle", type: 'text' }, { k: "Trans Hang", type: 'select', map: options.hang }
            ],
            block_active: [
                { k: "Moved", type: 'select', map: options.yes_no }, { k: "Hub Score", type: 'text' },
                { k: "Cycle", type: 'text' }, { k: "Neut. Zone", type: 'select', map: options.yes_no },
                { k: "Fuel Amt", type: 'text' }, { k: "Fuel Cycle", type: 'text' }, { k: "Hang", type: 'select', map: options.hang }
            ],
            block_inactive: [
                { k: "Moved", type: 'select', map: options.yes_no }, { k: "Role", type: 'select', map: options.role },
                { k: "Def Target", type: 'select', map: options.def_target }, { k: "Hub Skill", type: 'text' },
                { k: "Def Zone", type: 'select', map: options.def_zone }, { k: "Zone Skill", type: 'text' },
                { k: "Climb Lvl", type: 'select', map: options.climb }, { k: "Notes", type: 'text' }
            ],
            endgame: [
                { k: "End Moved", type: 'select', map: options.yes_no }, { k: "End Hub", type: 'text' },
                { k: "End Cycle", type: 'text' }, { k: "End Hang", type: 'select', map: options.climb },
                { k: "Addl RP", type: 'select', map: options.yes_no }, { k: "RP Type", type: 'select', map: options.rp_type }
            ],
            ratings: [
                { k: "R: Auto", type: 'text' }, { k: "R: Trans", type: 'text' },
                { k: "R: Active", type: 'text' }, { k: "R: Inactive", type: 'text' },
                { k: "R: End", type: 'text' }, { k: "R: Overall", type: 'text' },
                { k: "Strengths", type: 'select', map: options.strengths },
                { k: "Explain", type: 'text' }, { k: "Notes", type: 'text' }
            ]
        };

        function showScanner() {
            document.getElementById('home-screen').style.display = 'none';
            document.getElementById('scanner-view').style.display = 'block';
            html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, onScanSuccess);
        }

        function hideScanner() {
            return html5QrCode.stop().catch(() => { }).finally(() => {
                document.getElementById('scanner-view').style.display = 'none';
                document.getElementById('home-screen').style.display = 'block';
            });
        }

        async function triggerFileUpload() {
            if (html5QrCode.isScanning) await hideScanner();
            document.getElementById('qr-input-file').click();
        }

        function handleFileUpload(el) {
            if (!el.files.length) return;
            html5QrCode.scanFile(el.files[0], true)
                .then(res => onScanSuccess(res))
                .catch(err => alert("QR Error: Make sure the QR code is clear and not obstructed."))
                .finally(() => el.value = '');
        }

        function onScanSuccess(decodedText) {
            if (window.navigator.vibrate) window.navigator.vibrate(100);
            if (document.getElementById('scanner-view').style.display === 'block') hideScanner();
            parseAndStore(decodedText);
        }

        function parseAndStore(rawText) {
            try {
                const vals = rawText.split('|');
                let cursor = 0;
                const dataObj = {};

                const processBlock = (blockDef, prefix = "") => {
                    blockDef.forEach(def => {
                        const val = vals[cursor] || "";
                        cursor++;
                        let displayVal = val;
                        if (def.type === 'select' && def.map) {
                            const idx = parseInt(val);
                            displayVal = (!isNaN(idx) && def.map[idx]) ? def.map[idx] : val;
                        }
                        dataObj[prefix + def.k] = displayVal || "-";
                    });
                };

                processBlock(schema.header);
                processBlock(schema.auto);
                const startInactive = (vals[8] == "1");
                processBlock(schema.trans);

                const phaseOrder = startInactive
                    ? ["Init (In)", "Init (Act)", "2nd (In)", "2nd (Act)"]
                    : ["Init (Act)", "Init (In)", "2nd (Act)", "2nd (In)"];

                phaseOrder.forEach(p => {
                    processBlock(p.includes("Act") ? schema.block_active : schema.block_inactive, p + ": ");
                });

                processBlock(schema.endgame);
                processBlock(schema.ratings);

                allReports.unshift(dataObj);
                renderReports();
            } catch (e) {
                alert("Error parsing QR data. The format might be incorrect.");
            }
        }

        function renderReports() {
            const list = document.getElementById('report-list');
            document.getElementById('count-badge').innerText = \`\${allReports.length} Scanned\`;
            document.getElementById('btn-export').style.display = allReports.length ? 'block' : 'none';
            list.innerHTML = "";

            if (!allReports.length) {
                list.innerHTML = '<p style="text-align:center; color:#999; margin:40px 0;">No reports scanned yet.<\/p>';
                return;
            }

            allReports.forEach((report, idx) => {
                try {
                    const item = document.createElement('div');
                    item.className = 'report-item';

                    const del = document.createElement('button');
                    del.className = 'btn-delete';
                    del.innerText = 'Delete';
                    del.onclick = (e) => { e.stopPropagation(); allReports.splice(idx, 1); renderReports(); };

                    const sum = document.createElement('div');
                    sum.className = 'report-summary';
                    sum.innerHTML = \`<span>Team \${report['Team #'] || '???'}<\/span><span style="font-weight:normal;color:#666;font-size:0.8em">\${report['Scout Name'] || 'Unknown'}<\/span>\`;
                    sum.onclick = () => item.classList.toggle('expanded');

                    const det = document.createElement('div');
                    det.className = 'report-details';

                    let html = "";
                    for (const [k, v] of Object.entries(report)) {
                        if (!v || v === "-" || v === "none" || v === "Select...") continue;
                        html += \`<div class="data-line"><span class="label">\${k}<\/span><span class="value">\${v}<\/span><\/div>\`;
                    }
                    det.innerHTML = html;

                    item.append(del, sum, det);
                    list.appendChild(item);
                } catch (e) { console.error("Error rendering report index", idx); }
            });
        }

        function exportToHTMLFile() {
            if (!allReports || !allReports.length) return;

            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = \`scouting_\${dateStr}.html\`;

            // Define the exact order and labels requested by the user
            // Maps [Display Label]: [Internal Key Suffix]
            const fieldMapping = [
                { label: "Starting Position", key: "Start Pos" },
                { label: "A: Did they move", key: "Auto Moved" },
                { label: "A: Hub score", key: "Auto Hub" },
                { label: "A: Did they hang", key: "Auto Hang" },
                { label: "A: Score most", key: "Auto Most" },
                { label: "T: Did they move", key: "Trans Moved" },
                { label: "T: Hub score", key: "Trans Hub" },
                { label: "T: Cycle time", key: "Trans Cycle" },
                { label: "T: Did they hang", key: "Trans Hang" },
                // Phase 1 Active
                { label: "IA: Did they move", key: "Init (Act): Moved" },
                { label: "IA: Hub score", key: "Init (Act): Hub Score" },
                { label: "IA: Cycle time", key: "Init (Act): Cycle" },
                { label: "IA: Collect fuel", key: "Init (Act): Neut. Zone" },
                { label: "IA: Amt collected", key: "Init (Act): Fuel Amt" },
                { label: "IA: Fuel cycle time", key: "Init (Act): Fuel Cycle" },
                { label: "IA: Did they hang", key: "Init (Act): Hang" },
                // Phase 1 Inactive
                { label: "II: Did they move", key: "Init (In): Moved" },
                { label: "II: What role did they play", key: "Init (In): Role" },
                // Phase 2 Active
                { label: "SA: Did they move", key: "2nd (Act): Moved" },
                { label: "SA: Hub score", key: "2nd (Act): Hub Score" },
                { label: "SA: Cycle time", key: "2nd (Act): Cycle" },
                { label: "SA: Collect fuel", key: "2nd (Act): Neut. Zone" },
                { label: "SA: Amt collected", key: "2nd (Act): Fuel Amt" },
                { label: "SA: Fuel cycle time", key: "2nd (Act): Fuel Cycle" },
                { label: "SA: Did they hang", key: "2nd (Act): Hang" },
                // Phase 2 Inactive
                { label: "SI: Did they move", key: "2nd (In): Moved" },
                { label: "SI: What role did they play", key: "2nd (In): Role" },
                // Endgame
                { label: "EN: Did they move", key: "End Moved" },
                { label: "EN: Hub score", key: "End Hub" },
                { label: "EN: Cycle time", key: "End Cycle" },
                { label: "EN: Did they hang", key: "End Hang" },
                { label: "EN: Additional Ranking Points", key: "RP Type" },
                //Ratings
                { label: "A Rating", key: "R: Auto" },
                { label: "T Rating", key: "R: Trans" },
                { label: "Ac Rating", key: "R: Active" },
                { label: "In Rating", key: "R: Inactive" },
                { label: "En Rating", key: "R: End" },
                { label: "Ov Rating", key: "R: Overall" },
                { label: "Strengths", key: "Strengths" },
                { label: "Explain", key: "Explain" },
                { label: "Notes", key: "Notes" },
            ];

                        let htmlContent = \`
<!DOCTYPE html>
<html>
<head>
    <title>Vertical Export - \${dateStr}<\/title>
    <style>
        body { font-family: sans-serif; padding: 20px; background: #f4f4f9; }
        .controls { position: sticky; top: 0; background: #f4f4f9; padding: 10px; border-bottom: 2px solid #ccc; margin-bottom: 20px; }
        table { border-collapse: collapse; background: white; min-width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; white-space: nowrap; }
        th { background: #eee; position: sticky; left: 0; z-index: 2; }
        .selectable-col { cursor: pointer; transition: 0.2s; }
        .selectable-col:hover { background: #e8f4fd; }
        .selected { background: #3498db !important; color: white; }
        .btn-copy { padding: 10px 20px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    <\/style>
<\/head>
<body>
    <div class="controls">
        <button class="btn-copy" onclick="copySelectedColumns()">Copy Selected Columns to Sheets<\/button>
        <p id="status">Click columns to select them for export<\/p>
    <\/div>
    
    <table id="data-table">
        <thead>
            <tr>
                <th>Field \/ Report<\/th>
                \${allReports.map((r, i) => \`<th class="selectable-col" onclick="toggleCol(\${i})">Team \${r['Team #'] || i + 1}<\/th>\`).join('')}
            <\/tr>
        <\/thead>
        <tbody>
            \${fieldMapping.map(f => \`
                <tr>
                    <th>\${f.label}<\/th>
                    \${allReports.map((r, i) => \`<td class="col-\${i}">\${r[f.key] || "-"}<\/td>\`).join('')}
                <\/tr>
            \`).join('')}
        <\/tbody>
    <\/table>

    <script>
        let selectedIndices = [];

        function toggleCol(idx) {
            const th = document.querySelectorAll('.selectable-col')[idx];
            if (selectedIndices.includes(idx)) {
                selectedIndices = selectedIndices.filter(i => i !== idx);
                th.classList.remove('selected');
            } else {
                selectedIndices.push(idx);
                th.classList.add('selected');
            }
            document.getElementById('status').innerText = selectedIndices.length + " column(s) selected";
        }

        function copySelectedColumns() {
            if (selectedIndices.length === 0) return alert("Select at least one column!");
            
            const rows = document.querySelectorAll('#data-table tbody tr');
            let tsvLines = [];

            rows.forEach(row => {
                const values = selectedIndices.map(idx => {
                    return row.querySelectorAll('td')[idx].innerText;
                });
                tsvLines.push(values.join("\\\\t"));
            });

            const finalString = tsvLines.join("\\\\n");
            navigator.clipboard.writeText(finalString).then(() => {
                alert("Copied!");
            });
        }
    <\\\/script>
<\/body>
<\/html>\`;

            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
        }
    <\/script>
<\/body>

<\/html>`;