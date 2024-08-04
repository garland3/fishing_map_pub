const base_url = window.location.hostname.includes('github.io')
    ? 'https://garland3.github.io/fishing_map_pub/'
    : '';

//<!-- static/last_updated.txt -->
fetch(base_url + 'static/last_updated.txt')
    .then(response => response.text())
    .then(data => {
        document.getElementById('update-time').textContent = data.trim();
    })
    .catch(error => console.error('Error fetching last update time:', error));



var map = L.map('map').setView([34.5199, -105.8701], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const getUrl = () => base_url + 'static/data.json';

fetch(getUrl())
    // ... rest of your fetch logic here
    .then(response => response.json())
    .then(locations => {
        // All the code that uses the 'locations' variable goes here


        var dates = locations.flatMap(loc => loc.reports.map(report => new Date(report.stock_date)));
        var minDate = new Date(Math.min.apply(null, dates));
        var maxDate = new Date(Math.max.apply(null, dates));

        var colorScale = chroma.scale(['blue', 'green', 'yellow', 'red']).domain([minDate, maxDate]);

        locations.forEach(function (loc) {
            var latestReport = loc.reports.reduce((latest, report) =>
                new Date(report.stock_date) > new Date(latest.stock_date) ? report : latest
            );
            var color = colorScale(new Date(latestReport.stock_date)).hex();

            var marker = L.circleMarker([loc.lat, loc.long], {
                radius: 8,
                fillColor: color,
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);

            var sortedReports = loc.reports.sort((a, b) => new Date(b.stock_date) - new Date(a.stock_date));
            var recentReports = sortedReports.slice(0, 2);

            var popupContent = '<b>' + loc.name + '</b><br>';
            // popupContent= '<b>' + loc.name + '</b><br>';
            // popupContent += '<a href="https://www.google.com/maps/place/@' + loc.lat + ',' + loc.long + ',15z" target="_blank">View on Google Maps</a><br>'
            popupContent += '<a href="https://www.google.com/maps/search/?api=1&query=' + loc.lat + ',' + loc.long + '" target="_blank">View on Google Maps</a><br>';
            recentReports.forEach(function (report) {
                popupContent += 'Date: ' + report.stock_date + '<br>';
                popupContent += 'Hatchery: ' + report.hatchery + '<br>';
                popupContent += 'Amount: ' + report.lbs + ' lbs<br>';
                popupContent += '# of fish: ' + report.number + '<br>';
                popupContent += 'Length: ' + report.length + '<br>';
                popupContent += 'Species: ' + report.species + '<br><br>';
            });
            marker.bindPopup(popupContent);

            marker.on('click', function () {
                displayFullTable(loc);
            });
        });


        var legend = L.control({ position: 'bottomright' });
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend');
            div.style.backgroundColor = 'white';
            div.style.padding = '10px';
            div.innerHTML += '<h4>Stock Date</h4>';

            var canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 20;
            var ctx = canvas.getContext('2d');
            var gradient = ctx.createLinearGradient(0, 0, 200, 0);
            gradient.addColorStop(0, 'blue');
            gradient.addColorStop(0.33, 'green');
            gradient.addColorStop(0.66, 'yellow');
            gradient.addColorStop(1, 'red');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 200, 20);
            div.appendChild(canvas);

            var colors = ['blue', 'green', 'yellow', 'red'];
            var legendMarkers = document.createElement('div');
            legendMarkers.style.marginTop = '10px';

            var dateRange = maxDate.getTime() - minDate.getTime();

            colors.forEach(function (color, index) {
                var markerDiv = document.createElement('div');
                markerDiv.style.display = 'flex';
                markerDiv.style.alignItems = 'center';
                markerDiv.style.marginBottom = '5px';

                var circle = document.createElement('div');
                circle.style.width = '12px';
                circle.style.height = '12px';
                circle.style.borderRadius = '50%';
                circle.style.backgroundColor = color;
                circle.style.border = '1px solid #000';
                circle.style.marginRight = '5px';

                markerDiv.appendChild(circle);

                var date = new Date(minDate.getTime() + (dateRange * (index / (colors.length - 1))));
                var dateString = date.toLocaleDateString();

                markerDiv.appendChild(document.createTextNode(dateString));
                legendMarkers.appendChild(markerDiv);
            });
            div.appendChild(legendMarkers);

            return div;
        };
        legend.addTo(map);
    })
    .catch(error => console.error('Error loading the JSON file:', error));

function displayFullTable(location) {
    var tableDiv = document.getElementById('fullDataTable');

    // Define column names and their corresponding data keys
    const columns = [
        { name: 'Date', key: 'stock_date' },
        { name: 'Hatchery', key: 'hatchery' },
        { name: 'Amount', key: 'lbs', suffix: ' lbs' },
        { name: '# of fish', key: 'number' },
        { name: 'Length', key: 'length' },
        { name: 'Species', key: 'species' }
    ];

    let table = `
    <h2 class="text-2xl font-bold mb-4">
        <a href="https://www.google.com/maps/search/?api=1&query=${location.lat},${location.long}" 
           target="_blank" 
           class="text-black hover:text-blue-700 hover:underline cursor-pointer flex items-center">
            ${location.name} - All Reports
            <svg class="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
        </a>
    </h2>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
`;
    // Generate table header
    columns.forEach(column => {
        table += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${column.name}</th>`;
    });

    table += `
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
    `;

    // Generate table rows
    location.reports.forEach((report, index) => {
        table += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
        columns.forEach(column => {
            let value = report[column.key];
            if (column.suffix) value += column.suffix;
            table += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${value}</td>`;
        });
        table += `</tr>`;
    });

    table += `
                </tbody>
            </table>
        </div>
    `;

    tableDiv.innerHTML = table;
}