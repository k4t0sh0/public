const colors = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4'];
let nodes = [{ id: 1, text: 'メインアイデア', x: 400, y: 300, parentId: null, color: '#6366f1', isRoot: true }];
let nextId = 2, selectedNode = null, draggingNode = null, dragOffset = { x: 0, y: 0 };
let viewOffset = { x: 0, y: 0 }, zoom = 1, draggingCanvas = false, dragStart = { x: 0, y: 0 };
let finderSelectedNode = null;
let searchResults = [], currentSearchIndex = -1, searchQuery = '';

const svg = document.getElementById('svg');
const view = document.getElementById('view');
const actions = document.getElementById('actions');
const deleteBtn = document.getElementById('deleteBtn');
const breadcrumb = document.getElementById('breadcrumb');
const searchInput = document.getElementById('searchInput');
const searchResultsSpan = document.getElementById('searchResults');

function splitText(text, maxLen) {
    const delimiters = ['、', '。', 'て、', 'が', 'を', 'に', 'は', 'の'];
    const result = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLen) {
            result.push(remaining);
            break;
        }

        let splitPos = maxLen;
        let foundDelimiter = false;

        for (let i = Math.min(maxLen, remaining.length) - 1; i >= Math.max(0, maxLen - 4); i--) {
            const char = remaining[i];
            if (delimiters.some(d => remaining.substring(i, i + d.length) === d)) {
                splitPos = i + 1;
                if (char === '、' || char === '。') splitPos = i + 1;
                foundDelimiter = true;
                break;
            }
        }

        if (!foundDelimiter) {
            splitPos = maxLen;
        }

        result.push(remaining.substring(0, splitPos));
        remaining = remaining.substring(splitPos);
    }

    return result;
}

function draw() {
    view.innerHTML = '';
    nodes.forEach(n => {
        if (!n.parentId) return;
        const p = nodes.find(x => x.id === n.parentId);
        if (!p) return;
        const isRight = n.x > p.x;
        const sp = p.isRoot ? 70 : 70, ep = n.isRoot ? 70 : 70;
        const sx = isRight ? p.x + sp : p.x - sp, ex = isRight ? n.x - ep : n.x + ep;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${sx} ${p.y} C ${(sx + ex) / 2} ${p.y}, ${(sx + ex) / 2} ${n.y}, ${ex} ${n.y}`);
        path.setAttribute('stroke', '#cbd5e1');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        view.appendChild(path);
    });
    nodes.forEach(n => n.isRoot ? drawRoot(n) : drawNode(n));
    view.setAttribute('transform', `translate(${viewOffset.x},${viewOffset.y}) scale(${zoom})`);
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight-text">$1</span>');
}

function drawRoot(n) {
    const maxWidth = 150;
    const maxHeight = 90;

    const charCount = n.text.length;
    const estimatedLines = Math.ceil(charCount / 10);
    const calculatedHeight = Math.min(Math.max(50, estimatedLines * 18 + 20), maxHeight);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';
    g.onmousedown = ev => startNodeDrag(ev, n);

    const rx = 80;
    const ry = Math.max(35, calculatedHeight / 2);

    const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    e.setAttribute('cx', n.x); e.setAttribute('cy', n.y);
    e.setAttribute('rx', rx); e.setAttribute('ry', ry);
    e.setAttribute('fill', n.color);
    e.setAttribute('stroke', selectedNode === n.id ? '#1e293b' : 'white');
    e.setAttribute('stroke-width', selectedNode === n.id ? 3 : 2);
    e.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))';
    g.appendChild(e);

    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('x', n.x - 75);
    fo.setAttribute('y', n.y - ry);
    fo.setAttribute('width', maxWidth);
    fo.setAttribute('height', ry * 2);
    fo.style.pointerEvents = 'none';

    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.textAlign = 'center';
    div.style.color = 'white';
    div.style.fontSize = '13px';
    div.style.fontWeight = 'bold';
    div.style.lineHeight = '1.4';
    div.style.padding = '8px';
    div.style.wordBreak = 'break-all';
    div.style.overflow = 'hidden';

    // 検索クエリがある場合はハイライト表示
    if (searchQuery && n.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        div.innerHTML = highlightText(n.text, searchQuery);
    } else {
        div.textContent = n.text;
    }

    fo.appendChild(div);
    g.appendChild(fo);
    view.appendChild(g);
}

function drawNode(n) {
    const w = 160;

    const charCount = n.text.length;
    const estimatedLines = Math.ceil(charCount / 14);
    const h = Math.max(50, Math.min(estimatedLines * 18 + 30, 150));

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';
    g.onmousedown = ev => startNodeDrag(ev, n);

    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', n.x - w / 2); r.setAttribute('y', n.y - h / 2);
    r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('rx', 8);
    r.setAttribute('fill', 'white');
    r.setAttribute('stroke', n.color);
    r.setAttribute('stroke-width', 2);
    r.style.filter = selectedNode === n.id ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.1))';
    g.appendChild(r);

    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('x', n.x - w / 2);
    fo.setAttribute('y', n.y - h / 2);
    fo.setAttribute('width', w);
    fo.setAttribute('height', h);
    fo.style.pointerEvents = 'none';

    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.textAlign = 'center';
    div.style.color = n.color;
    div.style.fontSize = '13px';
    div.style.fontWeight = '500';
    div.style.lineHeight = '1.4';
    div.style.padding = '10px';
    div.style.wordBreak = 'break-all';
    div.style.overflow = 'hidden';

    // 検索クエリがある場合はハイライト表示
    if (searchQuery && n.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        div.innerHTML = highlightText(n.text, searchQuery);
    } else {
        div.textContent = n.text;
    }

    fo.appendChild(div);
    g.appendChild(fo);
    view.appendChild(g);
}

function selectNode(id) {
    selectedNode = id;
    actions.style.display = 'flex';
    deleteBtn.style.display = id === 1 ? 'none' : 'inline-block';
    updateBreadcrumb();
    updateColumns();
    draw();
}

function saveData() { localStorage.setItem('mindmap-nodes', JSON.stringify(nodes)); }
function loadData() {
    const data = localStorage.getItem('mindmap-nodes');
    if (!data) return;
    try {
        nodes = JSON.parse(data);
        nextId = Math.max(...nodes.map(n => n.id)) + 1;
    } catch { }
}

function updateBreadcrumb() {
    breadcrumb.innerHTML = '';
    breadcrumb.style.display = 'block';
    let list = [], cur = nodes.find(n => n.id === selectedNode);
    while (cur) {
        list.unshift(cur);
        cur = cur.parentId ? nodes.find(n => n.id === cur.parentId) : null;
    }
    list.forEach((n, i) => {
        const span = document.createElement('span');
        span.className = 'breadcrumb-item';
        span.textContent = n.text.length > 15 ? n.text.slice(0, 15) + '…' : n.text;
        span.onclick = () => selectNode(n.id);
        breadcrumb.appendChild(span);
        if (i < list.length - 1) breadcrumb.appendChild(document.createTextNode(' › '));
    });
}

function getPath(nodeId) {
    const path = [];
    let cur = nodes.find(n => n.id === nodeId);
    while (cur) {
        path.unshift(cur);
        cur = cur.parentId ? nodes.find(n => n.id === cur.parentId) : null;
    }
    return path;
}

const columns = document.getElementById('columns');
function updateColumns() {
    columns.innerHTML = '';
    if (!finderSelectedNode && !selectedNode) return;
    const baseNodeId = finderSelectedNode ?? selectedNode;
    const path = getPath(baseNodeId);
    for (let depth = 0; depth <= path.length; depth++) {
        const col = document.createElement('div');
        col.style.display = 'inline-block';
        col.style.verticalAlign = 'top';
        col.style.width = '220px';
        col.style.height = '100%';
        col.style.borderRight = '1px solid #e5e7eb';
        col.style.padding = '6px';
        col.style.boxSizing = 'border-box';
        let parentId, highlightId = null;
        if (depth === 0) {
            parentId = null;
            highlightId = path[0]?.id;
        } else if (depth < path.length) {
            parentId = path[depth - 1].id;
            highlightId = path[depth]?.id;
        } else {
            parentId = path[path.length - 1].id;
            highlightId = null;
        }
        const list = nodes.filter(n => n.parentId === parentId);
        if (list.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = '(子ノードなし)';
            empty.style.color = '#9ca3af';
            empty.style.fontSize = '13px';
            empty.style.padding = '6px';
            col.appendChild(empty);
        }
        list.forEach(n => {
            const item = document.createElement('div');
            item.className = 'column-item';
            const displayText = n.text.length > 20 ? n.text.slice(0, 20) + '…' : n.text;
            item.textContent = displayText;
            item.title = n.text;
            if (n.id === highlightId || n.id === finderSelectedNode) item.classList.add('selected');
            item.onclick = (e) => {
                e.stopPropagation();
                finderSelectedNode = n.id;
                updateColumns();
            };
            col.appendChild(item);
        });
        columns.appendChild(col);
    }
}

function startNodeDrag(e, n) {
    e.stopPropagation();
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewOffset.x) / zoom;
    const y = (e.clientY - rect.top - viewOffset.y) / zoom;
    draggingNode = n;
    dragOffset = { x: x - n.x, y: y - n.y };
    selectNode(n.id);
}

svg.onmousedown = e => {
    if (draggingNode) return;
    draggingCanvas = true;
    dragStart = { x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y };
};

svg.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - viewOffset.x) / zoom;
    const worldY = (mouseY - viewOffset.y) / zoom;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.3), 3);
    viewOffset.x = mouseX - worldX * newZoom;
    viewOffset.y = mouseY - worldY * newZoom;
    zoom = newZoom;
    draw();
}, { passive: false });

window.onmousemove = e => {
    if (draggingNode) {
        const rect = svg.getBoundingClientRect();
        const x = (e.clientX - rect.left - viewOffset.x) / zoom;
        const y = (e.clientY - rect.top - viewOffset.y) / zoom;
        draggingNode.x = x - dragOffset.x;
        draggingNode.y = y - dragOffset.y;
        draw();
    } else if (draggingCanvas) {
        viewOffset.x = e.clientX - dragStart.x;
        viewOffset.y = e.clientY - dragStart.y;
        draw();
    }
};

window.onmouseup = () => {
    if (draggingNode) saveData();
    draggingNode = null;
    draggingCanvas = false;
};

function addChild() {
    const p = nodes.find(n => n.id === selectedNode);
    if (!p) return;
    const angle = Math.random() * Math.PI * 2, d = 200;
    nodes.push({
        id: nextId++, text: '新しいノード',
        x: p.x + Math.cos(angle) * d, y: p.y + Math.sin(angle) * d,
        parentId: p.id, color: colors[Math.floor(Math.random() * colors.length)], isRoot: false
    });
    draw();
    saveData();
}

function startEdit() {
    const n = nodes.find(n => n.id === selectedNode);
    if (!n) return;
    const t = prompt('編集', n.text);
    if (t !== null && t.trim() !== '') {
        n.text = t;
        draw();
        updateBreadcrumb();
        updateColumns();
        saveData();
    }
}

function deleteNode() {
    function remove(id) {
        nodes.filter(n => n.parentId === id).forEach(c => remove(c.id));
        nodes = nodes.filter(n => n.id !== id);
    }
    if (selectedNode !== 1) {
        remove(selectedNode);
        selectedNode = null;
        actions.style.display = 'none';
        breadcrumb.style.display = 'none';
        draw();
        saveData();
        updateColumns();
    }
}

function zoomIn() { zoom = Math.min(zoom * 1.2, 3); draw(); }
function zoomOut() { zoom = Math.max(zoom * 0.8, 0.3); draw(); }
function resetView() { zoom = 1; viewOffset = { x: 0, y: 0 }; draw(); }

const finderOverlay = document.getElementById('finderOverlay');
function toggleFinder() {
    finderOverlay.classList.toggle('show');
    if (finderOverlay.classList.contains('show')) {
        finderSelectedNode = selectedNode;
        updateColumns();
    }
}

window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && finderOverlay.classList.contains('show')) toggleFinder();
});

window.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !finderOverlay.classList.contains('show') || !finderSelectedNode) return;
    selectNode(finderSelectedNode);
    const node = nodes.find(n => n.id === finderSelectedNode);
    if (node) teleportToNode(node);
    toggleFinder();
});

function teleportToNode(node) {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    viewOffset.x = cx - node.x * zoom;
    viewOffset.y = cy - node.y * zoom;
    draw();
}

function exportData() {
    const json = JSON.stringify(nodes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('エクスポートが完了しました');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!confirm('現在のデータは上書きされます。インポートを続けますか?')) {
        event.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedNodes = JSON.parse(e.target.result);
            if (!Array.isArray(importedNodes) || importedNodes.length === 0) {
                alert('無効なファイル形式です');
                return;
            }
            const isValid = importedNodes.every(n => n.id !== undefined && n.text !== undefined && n.x !== undefined && n.y !== undefined);
            if (!isValid) {
                alert('ファイルに不正なデータが含まれています');
                return;
            }
            nodes = importedNodes;
            nextId = Math.max(...nodes.map(n => n.id)) + 1;
            selectedNode = nodes[0] ? nodes[0].id : null;
            finderSelectedNode = null;
            actions.style.display = 'none';
            breadcrumb.style.display = 'none';
            draw();
            saveData();
            alert('インポートが完了しました!');
        } catch (error) {
            alert('ファイルの読み込みに失敗しました: ' + error.message);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

loadData();
selectedNode = 1;
draw();

// 検索機能
function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    searchQuery = searchInput.value.trim();

    if (!query) {
        clearSearch();
        return;
    }

    searchResults = nodes.filter(n => n.text.toLowerCase().includes(query)).map(n => n.id);
    currentSearchIndex = searchResults.length > 0 ? 0 : -1;

    updateSearchResults();
    if (currentSearchIndex >= 0) {
        jumpToSearchResult(currentSearchIndex);
    }
}

function updateSearchResults() {
    if (searchResults.length === 0) {
        searchResultsSpan.textContent = '見つかりません';
    } else {
        searchResultsSpan.textContent = `${currentSearchIndex + 1} / ${searchResults.length}`;
    }
    draw();
    updateColumns();
}

function searchNext() {
    if (searchResults.length === 0) return;
    currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
    jumpToSearchResult(currentSearchIndex);
    updateSearchResults();
}

function searchPrev() {
    if (searchResults.length === 0) return;
    currentSearchIndex = (currentSearchIndex -
        1 + searchResults.length) % searchResults.length;
    jumpToSearchResult(currentSearchIndex);
    updateSearchResults();
}

function jumpToSearchResult(index) {
    if (index < 0 || index >= searchResults.length) return;
    const nodeId = searchResults[index];
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        selectNode(nodeId);
        setTimeout(() => {
            teleportToNode(node);
        }, 10);
    }
}

function clearSearch() {
    searchInput.value = '';
    searchResults = [];
    currentSearchIndex = -1;
    searchQuery = '';
    searchResultsSpan.textContent = '';
    draw();
    updateColumns();
}

searchInput.addEventListener('input', performSearch);
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.shiftKey ? searchPrev() : searchNext();
    } else if (e.key === 'Escape') {
        clearSearch();
        searchInput.blur();
    }
});

window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
});