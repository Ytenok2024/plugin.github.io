document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => showMessage(data.message))
    .catch(error => showMessage('Ошибка: ' + error.message));
});

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => showMessage(data.message))
    .catch(error => showMessage('Ошибка: ' + error.message));
});

function showMessage(msg) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerText = msg;
    
    // Удаляем сообщение через 3 секунды
    setTimeout(() => {
        messageDiv.innerText = '';
    }, 3000);
}
