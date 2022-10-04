var execBtn = document.getElementById("execute");
var outputElm = document.getElementById('output');
var errorElm = document.getElementById('error');
var commandsElm = document.getElementById('commands');
var dbFileElm = document.getElementById('dbfile');
var savedbElm = document.getElementById('savedb');

// Start the worker in which sql.js will run
var worker = new Worker("dist/worker.sql-wasm.js");

// Open a database
worker.postMessage({ action: 'open' });

function noerror() {
    errorElm.style.height = '0';
}

// Run a command in the database
function execute(commands) {
    tic();
    worker.onmessage = function (event) {
        var results = event.data.results;
        toc("Executing SQL");
        if (!results) {
            return;
        }

        tic();
        outputElm.innerHTML = "";
        for (var i = 0; i < results.length; i++) {
            outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
        }
        toc("Displaying results");
    }
    worker.postMessage({ action: 'exec', sql: commands });
    outputElm.textContent = "Fetching results...";
}

// Execute the commands when the button is clicked
function execEditorContents() {
    noerror()
    execute('Select * from parsed_users where is_scam = 1');
}
execEditorContents()

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
function tic() { tictime = performance.now() }
function toc(msg) {
    var dt = performance.now() - tictime;
    console.log((msg || 'toc') + ": " + dt + "ms");
}

// Load a db from a file

var f = dbFileElm.files[0];
console.log(f)
var r = new FileReader();
r.onload = function () {
    worker.onmessage = function () {
        toc("Loading database from file");
        // Show the schema of the loaded database
        execEditorContents();
    };
    tic();
    try {
        worker.postMessage({ action: 'open', buffer: r.result }, [r.result]);
    }
    catch (exception) {
        worker.postMessage({ action: 'open', buffer: r.result });
    }
}
r.readAsArrayBuffer(f);

