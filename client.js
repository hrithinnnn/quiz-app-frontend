const socket = io('http://localhost:3000');
let roomId;
let playerName;
let timer;
let remainingTime = 10;

document.addEventListener('DOMContentLoaded', () => {
  roomId = prompt("Enter room ID:");
  playerName = prompt("Enter your name:");
  const newG=document.getElementById('newGame');
  newG.addEventListener('click',()=>{
    window.location.reload();
  })
  socket.on('connect', () => {
    console.log('connected to server');
    socket.emit('joinRoom', { roomId: roomId, playerName: playerName });
  });

  socket.on('startGame', () => {
    console.log('All players are ready. Starting the game.');
  });

  socket.on('showQuestion', (question) => {
    displayQuestion(question);
    startTimer(); // Start the question timer
  });

  socket.on('updatePlayers', (players) => {
    console.log('Received updated players:', players);
    const displayArea = document.getElementById('displayArea');
    displayArea.innerHTML = ''; // Clear the display area
    players.forEach(player => {
      const playerInfo = document.createElement('p');
      playerInfo.innerText = `Player ${player.name}: Score ${player.score} ${player.ready ? '(Ready)' : ''}`;
      displayArea.appendChild(playerInfo);
    });
  });

  socket.on('readyCount', (count) => {
    document.getElementById('readyCount').innerText = `Ready Players: ${count}`;
  });

  socket.on('chatMessage', (data) => {
    const chatArea = document.getElementById('chatArea');
    const message = document.createElement('p');
    message.innerText = `${data.name}: ${data.message}`;
    chatArea.appendChild(message);
  });

  socket.on('gameOver', (players) => {
    console.log('Game Over. Final Scores:', players);
    const questionArea = document.getElementById('questionArea');
  questionArea.innerHTML = ''; // Clear the question area
    // Display final scores or perform other end of game actions
    const questionElem = document.getElementById('questionArea');
    questionElem.innertext="";
    for(let i=0;i<players.length;i++){
      questionElem.innerText+=`${i+1}. ${players[i].name}: ${players[i].score}\n`;
    }
    socket.disconnect();
    let res=prompt("join again?");
    if(res==="yes"){
      socket.connect();
    }
  });
});

function displayQuestion(question) {
  const questionArea = document.getElementById('questionArea');
  questionArea.innerHTML = ''; // Clear the question area
  const questionElem = document.createElement('p');
  questionElem.innerText = `${question.question}`;
  questionArea.appendChild(questionElem);
  // Display choices if it's a multiple-choice question
  if (question.type === 'multiple') {
    question.incorrect_answers.concat(question.correct_answer)
      .sort(() => 0.5 - Math.random()) // Shuffle options
      .forEach(answer => {
        const answerElem = document.createElement('button');
        answerElem.innerText = answer;
        answerElem.addEventListener('click', () => {
          submitAnswer(answer === question.correct_answer);
        });
        questionArea.appendChild(answerElem);
      });
  } else if (question.type === 'boolean') {
    ['True', 'False'].forEach(answer => {
      const answerElem = document.createElement('button');
      answerElem.innerText = answer;
      answerElem.addEventListener('click', () => {
        submitAnswer(answer === question.correct_answer);
      });
      questionArea.appendChild(answerElem);
    });
  }
}

function startTimer() {
  remainingTime = 10;
  document.getElementById('timer').innerText = `Time left: ${remainingTime}`;
  timer = setInterval(() => {
    remainingTime--;
    document.getElementById('timer').innerText = `Time left: ${remainingTime}`;
    if (remainingTime <= 0) {
      clearInterval(timer);
      document.getElementById('timer').innerText = 'Time is up!';
      submitAnswer(false); // Submit a false answer if time is up
    }
  }, 1000);
}

function submitAnswer(isCorrect) {
  clearInterval(timer); // Stop the timer when the button is clicked
  const score = isCorrect && remainingTime > 0 ? remainingTime : 0;
  console.log('Button clicked, sending score:', score);
  socket.emit('playerAnswers', { roomId: roomId, score: score });
}

const readyBtn = document.getElementById('ready');

readyBtn.addEventListener('click', () => {
  const ready = true;
  console.log('Ready button clicked');
  socket.emit('playerReady', { roomId: roomId, ready: ready });
});

const chatInput = document.getElementById('chatInput');
const chatSubmit = document.getElementById('chatSubmit');

chatSubmit.addEventListener('click', () => {
  const message = chatInput.value;
  socket.emit('chatMessage', { roomId: roomId, message: message, name:playerName });
  chatInput.value = ''; // Clear the input field
});
