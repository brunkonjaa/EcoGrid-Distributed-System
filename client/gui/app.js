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

    services.forEach((service) => {
        const tile = document.createElement('article');
        const isDiscovered = service.status === 'DISCOVERED' || service.host;
        tile.className = `service-tile ${isDiscovered ? 'discovered' : 'unavailable'}`;

        const endpoint = service.host && service.port
            ? `${service.host}:${service.port}`
            : service.error || 'Not available';

        tile.innerHTML = `
            <strong>${service.service_name}</strong>
            <span>${endpoint}</span>
            <span>${service.rpc_package || service.status || ''}</span>
        `;

        serviceGrid.appendChild(tile);
    });
}

async function discoverAllServices() {
    const stopLoading = setButtonLoading(buttons.discoverAll, 'Discovering...');

    try {
        const data = await apiRequest('/api/registry');
        renderServices(data.services);
        addLog('Registry discovery completed for Temperature, Occupancy, and Control.');
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
        outputs.temperature.textContent = formatJson(data);
        addLog(`Temperature service invoked through ${data.endpoint}.`);
    } catch (error) {
        outputs.temperature.textContent = error.message;
        addLog(`Temperature request failed: ${error.message}`, true);
    } finally {
        stopLoading();
    }
}

async function runOccupancy() {
    const stopLoading = setButtonLoading(buttons.occupancy, 'Streaming...');
    const area = document.querySelector('#occupancyArea').value.trim() || 'Room A';
    outputs.occupancy.textContent = 'Waiting for stream updates...';

    try {
        const data = await apiRequest('/api/occupancy', {
            method: 'POST',
            body: JSON.stringify({ area })
        });
        outputs.occupancy.textContent = formatJson(data);
        addLog(`Occupancy stream completed through ${data.endpoint}.`);
    } catch (error) {
        outputs.occupancy.textContent = error.message;
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
        outputs.control.textContent = formatJson(data);
        addLog(`Control stream completed through ${data.endpoint}.`);
    } catch (error) {
        outputs.control.textContent = error.message;
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
