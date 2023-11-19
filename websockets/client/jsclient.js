const WebSocket = require('ws');

const socket = new WebSocket('ws://localhost:12345');
const clientID = Math.random().toString(36).substr(2, 9);
let sharedText = '';

function displayText(text) {
  // clear console
  console.clear();
  // display text
  console.log(text);
}

// This code runs when the connection is first opened.
// It sends a message to the server to request the current text.
// The response from the server is handled by the message event listener below.
socket.addEventListener('open', function (event) {
  console.log('Connected to the WebSocket server');
  // Request the current text
  socket.send(JSON.stringify({ type: 'get-text' }));
});

// This code runs when a message is received from the server.
// It will display the text sent by the server.
socket.addEventListener('message', function (event) {
  const msg = JSON.parse(event.data);
  if (msg.type === 'text') {
    // Update the text
    displayText(msg.data);
    sharedText = msg.data;
  }
});

// Function to call when the text is updated by the user
function updateText(newText) {
  // Send the updated text to the server
  const textToSend = sharedText + newText;
  socket.send(JSON.stringify({ type: 'update-text', data: textToSend }));
}

// main loop
function main() {
  // Get the current text from the user
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter text: ', (answer) => {
    // Update the text
    updateText(answer);
    // Close the readline interface
    rl.close();
    // Call main again
    main();
  });
}

main();