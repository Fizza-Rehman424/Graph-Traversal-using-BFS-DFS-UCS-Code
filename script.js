const graph = {
    Karachi: [{ city: "Hyderabad", cost: 3 }, { city: "Quetta", cost: 8 }, { city: "Islamabad", cost: 15 }],
    Hyderabad: [{ city: "Karachi", cost: 3 }, { city: "Multan", cost: 6 }, { city: "Sukkur", cost: 5 }],
    Quetta: [{ city: "Karachi", cost: 8 }, { city: "Peshawar", cost: 10 }, { city: "Lahore", cost: 13 }],
    Multan: [{ city: "Hyderabad", cost: 6 }, { city: "Lahore", cost: 4 }, { city: "Faisalabad", cost: 7 }],
    Peshawar: [{ city: "Quetta", cost: 10 }, { city: "Islamabad", cost: 2 }, { city: "Mardan", cost: 3 }],
    Lahore: [{ city: "Multan", cost: 4 }, { city: "Islamabad", cost: 5 }, { city: "Rawalpindi", cost: 6 }],
    Islamabad: [{ city: "Lahore", cost: 5 }, { city: "Peshawar", cost: 2 }, { city: "Faisalabad", cost: 9 }],
    Rawalpindi: [{ city: "Lahore", cost: 6 }, { city: "Islamabad", cost: 0 }],
    Faisalabad: [{ city: "Multan", cost: 7 }, { city: "Islamabad", cost: 9 }],
    Sukkur: [{ city: "Hyderabad", cost: 5 }, { city: "Karachi", cost: 9 }],
    Mardan: [{ city: "Peshawar", cost: 3 }],
};

const nodePositions = {
    Karachi: { x: 0, y: 0 },
    Hyderabad: { x: 200, y: 0 },
    Quetta: { x: 0, y: 200 },
    Multan: { x: 200, y: 200 },
    Peshawar: { x: 400, y: 200 },
    Lahore: { x: 400, y: 0 },
    Islamabad: { x: 600, y: 100 },
    Rawalpindi: { x: 650, y: 150 },
    Faisalabad: { x: 250, y: 300 },
    Sukkur: { x: 50, y: 100 },
    Mardan: { x: 450, y: 150 },
};

let currentAlgorithm = null;
let network;

function renderGraph(showCost = false, highlightedNodes = [], destinationNode = null) {
    const nodes = [];
    const edges = [];
    const addedEdges = new Set(); // To track added edges and prevent duplicates

    Object.keys(graph).forEach((city) => {
        nodes.push({
            id: city,
            label: city,
            x: nodePositions[city]?.x || 0,
            y: nodePositions[city]?.y || 0,
            color: highlightedNodes.includes(city) ? 'red' : (city === destinationNode ? 'green' : 'blue'),
        });

        graph[city].forEach((neighbor) => {
            const edgeKey = [city, neighbor.city].sort().join("-"); // Create a unique key for each edge
            if (!addedEdges.has(edgeKey)) {
                edges.push({
                    from: city,
                    to: neighbor.city,
                    label: showCost ? `${neighbor.cost}` : "",
                    arrows: "", // No arrows
                });
                addedEdges.add(edgeKey); // Mark this edge as added
            }
        });
    });

    const container = document.getElementById("graph");
    const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
    const options = { edges: { font: { align: "top" } } };

    if (network) network.destroy(); // Destroy existing network if any
    network = new vis.Network(container, data, options);
}

function bfs(graph, start, end) {
    const queue = [[start]];
    const visited = new Set();
    let steps = 0;

    while (queue.length) {
        const path = queue.shift();
        const city = path[path.length - 1];
        steps++;

        if (city === end) return { path, cost: "N/A", steps };

        if (!visited.has(city)) {
            visited.add(city);
            graph[city].forEach((neighbor) => {
                queue.push([...path, neighbor.city]);
            });
        }
    }
    return { path: [], cost: "N/A", steps };
}

function dfs(graph, start, end) {
    const stack = [[start]];
    const visited = new Set();
    let steps = 0;

    while (stack.length) {
        const path = stack.pop();
        const city = path[path.length - 1];
        steps++;

        if (city === end) return { path, cost: "N/A", steps };

        if (!visited.has(city)) {
            visited.add(city);
            graph[city].forEach((neighbor) => {
                stack.push([...path, neighbor.city]);
            });
        }
    }
    return { path: [], cost: "N/A", steps };
}

function ucs(graph, start, end) {
    const pq = [{ path: [start], cost: 0 }];
    const visited = new Set();
    let steps = 0;

    while (pq.length) {
        pq.sort((a, b) => a.cost - b.cost);
        const { path, cost } = pq.shift();
        const city = path[path.length - 1];
        steps++;

        if (city === end) return { path, cost, steps };

        if (!visited.has(city)) {
            visited.add(city);
            graph[city].forEach((neighbor) => {
                pq.push({ path: [...path, neighbor.city], cost: cost + neighbor.cost });
            });
        }
    }
    return { path: [], cost: 0, steps };
}
async function highlightPath(path) {
    for (let i = 0; i < path.length; i++) {
        renderGraph(false, path.slice(0, i + 1)); // Highlight nodes up to the current step
        await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay for animation
    }
}


async function findPath() {
    const start = document.getElementById("start").value.trim();
    const end = document.getElementById("end").value.trim();

    if (!graph[start] || !graph[end]) {
        alert("Invalid cities. Please enter valid city names.");
        return;
    }

    const algorithms = { bfs, dfs, ucs };
    const result = algorithms[currentAlgorithm](graph, start, end);

    if (result.path.length > 0) {
        await highlightPath(result.path); // Animate traversal by highlighting nodes
    } else {
        alert("No path found!");
    }

    const output = `
      <p><b>Algorithm:</b> ${currentAlgorithm.toUpperCase()}</p>
      <p><b>Path:</b> ${result.path.join(" → ")}</p>
      <p><b>Total Cost:</b> ${result.cost}</p>
      <p><b>Steps Taken:</b> ${result.steps}</p>
    `;
    document.getElementById("output").innerHTML = output;

    // Final graph render with the path fully highlighted
    renderGraph(currentAlgorithm === "ucs", result.path, result.path[result.path.length - 1]);
}
function renderGraph(showCost = false, highlightedNodes = [], destinationNode = null) {
    const nodes = [];
    const edges = [];
    const addedEdges = new Set(); // Track added edges to avoid duplicates

    Object.keys(graph).forEach((city) => {
        nodes.push({
            id: city,
            label: city,
            x: nodePositions[city]?.x || 0,
            y: nodePositions[city]?.y || 0,
            color: highlightedNodes.includes(city)
                ? 'green' // Highlight traversal nodes yellow
                : (city === destinationNode ? 'green' : 'blue'), // Final path green
        });

        graph[city].forEach((neighbor) => {
            const edgeKey = [city, neighbor.city].sort().join("-");
            if (!addedEdges.has(edgeKey)) {
                edges.push({
                    from: city,
                    to: neighbor.city,
                    label: showCost ? `${neighbor.cost}` : "",
                    arrows: "",
                });
                addedEdges.add(edgeKey);
            }
        });
    });

    const container = document.getElementById("graph");
    const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
    const options = { edges: { font: { align: "top" } } };

    if (network) network.destroy();
    network = new vis.Network(container, data, options);
}

function resetGraph() {
    document.getElementById("output").innerHTML = "";
    document.getElementById("start").value = "";
    document.getElementById("end").value = "";

    renderGraph(currentAlgorithm === "ucs");
}

// Function to clear data when changing algorithm or screens
function resetScreen() {
    document.getElementById("output").innerHTML = "";
    document.getElementById("start").value = "";
    document.getElementById("end").value = "";
    if (network) network.destroy(); // Destroy existing network
    document.getElementById("graph").style.display = "none";
    document.querySelector(".run-controls").style.display = "none";
}

// Event Listeners
document.getElementById("bfs").addEventListener("click", () => {
    currentAlgorithm = "bfs";
    resetGraph(); // Clear previous outputs and graph
    renderGraph(false); // Re-render the graph
});

document.getElementById("dfs").addEventListener("click", () => {
    currentAlgorithm = "dfs";
    resetGraph(); // Clear previous outputs and graph
    renderGraph(false); // Re-render the graph
});

document.getElementById("ucs").addEventListener("click", () => {
    currentAlgorithm = "ucs";
    resetGraph(); // Clear previous outputs and graph
    renderGraph(true); // UCS shows cost on the edges
});

document.getElementById("run").addEventListener("click", findPath);
document.getElementById("reset").addEventListener("click", resetGraph);

// Add Route function
function addRoute() {
    const start = document.getElementById("start").value.trim();
    const end = document.getElementById("end").value.trim();

    if (!start || !end) {
        alert("Please enter valid Start and End nodes.");
        return;
    }

    const cost = prompt(`Enter the cost for the route from ${start} to ${end}:`);
    const parsedCost = parseFloat(cost);

    if (isNaN(parsedCost) || parsedCost <= 0) {
        alert("Please enter a valid positive cost.");
        return;
    }

    if (!graph[start]) graph[start] = [];
    if (!graph[end]) graph[end] = [];

    graph[start].push({ city: end, cost: parsedCost });
    graph[end].push({ city: start, cost: parsedCost });

    alert(`Route added: ${start} ↔ ${end} with cost ${parsedCost}`);

    renderGraph(currentAlgorithm === "ucs");
}

document.getElementById("addRoute").addEventListener("click", addRoute);
