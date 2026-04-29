const serviceGrid = document.querySelector('#serviceGrid');
const activityLog = document.querySelector('#activityLog');

const buttons = {
    discoverAll: document.querySelector('#discoverAllBtn'),
    temperature: document.querySelector('#temperatureBtn'),
    occupancy: document.querySelector('#occupancyBtn'),
    control: document.querySelector('#controlBtn'),
    clearLog: document.querySelector('#clearLogBtn')
};

const outputs = {
    temperature: document.querySelector('#temperatureOutput'),
    occupancy: document.querySelector('#occupancyOutput'),
    control: document.querySelector('#controlOutput')
};

function formatJson(value) {
    return JSON.stringify(value, null, 2);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDateTime(value) {
    if (!value) {
        return 'Not supplied';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function renderOutput(target, summaryHtml, technicalData) {
    target.innerHTML = `
        <div class="result-summary">
            ${summaryHtml}
        </div>
        <details class="technical-details">
            <summary>Technical response</summary>
            <pre>${escapeHtml(formatJson(technicalData))}</pre>
        </details>
    `;
}

function renderError(target, message) {
    target.innerHTML = `
        <div class="result-summary error-summary">
            <span class="result-label">Request failed</span>
            <strong>${escapeHtml(message)}</strong>
        </div>
    `;
}

function resultRow(label, value) {
    return `
        <div class="result-row">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
        </div>
    `;
}

function addLog(message, isError = false) {
    const entry = document.createElement('div');
    entry.className = `log-entry${isError ? ' error' : ''}`;
    entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    activityLog.prepend(entry);
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json'
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok || data.ok === false) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

function setButtonLoading(button, loadingText) {
    const originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;

    return () => {
        button.textContent = originalText;
        button.disabled = false;
    };
}

function renderServices(services) {
    serviceGrid.innerHTML = '';

    const visibleServices = [
        {
            service_name: 'registry-service',
            host: 'localhost',
            port: 50054,
            rpc_package: 'registry',
            status: 'NAMING SERVICE'
        },
        ...services
    ];

    visibleServices.forEach((service) => {
        const tile = document.createElement('article');
        const isRegistry = service.service_name === 'registry-service';
        const isDiscovered = isRegistry || service.status === 'DISCOVERED' || service.host;
        tile.className = `service-tile ${isDiscovered ? 'discovered' : 'unavailable'}`;

        const endpoint = service.host && service.port
            ? `${service.host}:${service.port}`
            : service.error || 'Not available';

        tile.innerHTML = `
            <strong>${escapeHtml(service.service_name)}</strong>
            <span>${escapeHtml(endpoint)}</span>
            <span>Status: ${escapeHtml(service.status || 'UNKNOWN')}</span>
            <span>Package: ${escapeHtml(service.rpc_package || 'Not discovered')}</span>
        `;

        serviceGrid.appendChild(tile);
    });
}

async function discoverAllServices() {
    const stopLoading = setButtonLoading(buttons.discoverAll, 'Discovering...');

    try {
        const data = await apiRequest('/api/registry');
        renderServices(data.services);
        const discoveredCount = data.services.filter((service) => service.status === 'DISCOVERED').length;
        addLog(`Registry discovery completed: ${discoveredCount} smart services discovered through the naming service.`);
    } catch (error) {
        addLog(`Discovery failed: ${error.message}`, true);
    } finally {
        stopLoading();
    }
}

async function runTemperature() {
    const stopLoading = setButtonLoading(buttons.temperature, 'Calling...');
    const area = document.querySelector('#temperatureArea').value.trim() || 'Room A';

    try {
        const data = await apiRequest('/api/temperature', {
            method: 'POST',
            body: JSON.stringify({ area })
        });
        const reading = data.data;

        renderOutput(outputs.temperature, `
            <span class="result-label">Latest temperature reading</span>
            <div class="primary-reading">${escapeHtml(reading.temperature_value)} ${escapeHtml(reading.unit)}</div>
            ${resultRow('Area', reading.area)}
            ${resultRow('Endpoint', data.endpoint)}
            ${resultRow('Timestamp', formatDateTime(reading.timestamp))}
        `, data);
        addLog(`Temperature reading for ${reading.area} returned through ${data.endpoint}.`);
    } catch (error) {
        renderError(outputs.temperature, error.message);
        addLog(`Temperature request failed: ${error.message}`, true);
    } finally {
        stopLoading();
    }
}

async function runOccupancy() {
    const stopLoading = setButtonLoading(buttons.occupancy, 'Streaming...');
    const area = document.querySelector('#occupancyArea').value.trim() || 'Room A';
    outputs.occupancy.innerHTML = '<div class="waiting-state">Waiting for stream updates...</div>';

    try {
        const data = await apiRequest('/api/occupancy', {
            method: 'POST',
            body: JSON.stringify({ area })
        });
        const latestUpdate = data.updates[data.updates.length - 1] || {};
        const visibleUpdates = data.updates.slice(0, 2);
        const hiddenUpdates = data.updates.slice(2);
        const renderUpdateRows = (updates, startIndex = 0) => updates.map((update, index) => `
            <li>
                <span>Update ${startIndex + index + 1}</span>
                <strong>${update.occupied ? 'Occupied' : 'Empty'} | ${update.people_count} people</strong>
                <small>${escapeHtml(formatDateTime(update.timestamp))}</small>
            </li>
        `).join('');
        const hiddenUpdateDetails = hiddenUpdates.length > 0
            ? `
                <details class="update-details">
                    <summary>Expand ${hiddenUpdates.length} more updates</summary>
                    <ul class="stream-list hidden-updates">${renderUpdateRows(hiddenUpdates, visibleUpdates.length)}</ul>
                </details>
            `
            : '';

        renderOutput(outputs.occupancy, `
            <span class="result-label">Occupancy stream completed</span>
            <div class="primary-reading">${escapeHtml(data.updates.length)} updates</div>
            ${resultRow('Area', latestUpdate.area || area)}
            ${resultRow('Latest status', latestUpdate.occupied ? 'Occupied' : 'Empty')}
            ${resultRow('Endpoint', data.endpoint)}
            <ul class="stream-list">${renderUpdateRows(visibleUpdates)}</ul>
            ${hiddenUpdateDetails}
        `, data);
        addLog(`Occupancy stream returned ${data.updates.length} updates through ${data.endpoint}.`);
    } catch (error) {
        renderError(outputs.occupancy, error.message);
        addLog(`Occupancy stream failed: ${error.message}`, true);
    } finally {
        stopLoading();
    }
}

async function runControl() {
    const stopLoading = setButtonLoading(buttons.control, 'Sending...');
    const area = document.querySelector('#controlArea').value.trim() || 'Room A';
    const temperatureValue = Number(document.querySelector('#controlTemperature').value || 0);
    const peopleCount = Number(document.querySelector('#controlPeople').value || 0);
    const occupied = document.querySelector('#controlOccupied').checked;

    const readings = [
        {
            area,
            temperature_value: temperatureValue,
            occupied,
            people_count: peopleCount
        },
        {
            area,
            temperature_value: temperatureValue + 1,
            occupied,
            people_count: Math.max(peopleCount, occupied ? 1 : 0)
        },
        {
            area,
            temperature_value: temperatureValue,
            occupied,
            people_count: peopleCount
        }
    ];

    try {
        const data = await apiRequest('/api/control', {
            method: 'POST',
            body: JSON.stringify({ readings })
        });
        const decision = data.data;

        renderOutput(outputs.control, `
            <span class="result-label">Final control decision</span>
            <div class="primary-reading">${escapeHtml(decision.action)}</div>
            ${resultRow('Area', decision.area)}
            ${resultRow('Reason', decision.reason)}
            ${resultRow('Readings sent', data.sent.length)}
            ${resultRow('Endpoint', data.endpoint)}
        `, data);
        addLog(`Control decision ${decision.action} returned through ${data.endpoint}.`);
    } catch (error) {
        renderError(outputs.control, error.message);
        addLog(`Control stream failed: ${error.message}`, true);
    } finally {
        stopLoading();
    }
}

buttons.discoverAll.addEventListener('click', discoverAllServices);
buttons.temperature.addEventListener('click', runTemperature);
buttons.occupancy.addEventListener('click', runOccupancy);
buttons.control.addEventListener('click', runControl);
buttons.clearLog.addEventListener('click', () => {
    activityLog.innerHTML = '';
});

addLog('EcoGrid GUI loaded. Start registry and services, then discover services.');
