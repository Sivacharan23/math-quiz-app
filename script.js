let username = "", useremail = "";
let score = 0, questionCount = 0, level = 1;
let currentAnswer = 0, timer, timeLeft = 15, questionStartTime = 0;
let timePerQuestion = [], askedQuestions = new Set();
const totalQuestionsPerLevel = 20;

// DOM elements
const questionEl = document.getElementById("question");
const answerInput = document.getElementById("answerInput");
const submitBtn = document.getElementById("submit");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const progressEl = document.getElementById("progress");
const timerEl = document.getElementById("timer");
const welcomeUserEl = document.getElementById("welcomeUser");
const certCanvas = document.getElementById("certificateCanvas");
const certLink = document.getElementById("downloadCert");

// Sounds
const correctSound = new Audio("correct.mp3");
const wrongSound = new Audio("wrong.mp3");
const levelUpSound = new Audio("levelup.mp3");

document.getElementById("darkToggle").addEventListener("change", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("dark", document.body.classList.contains("dark-mode"));
});

// Restore dark mode
if (localStorage.getItem("dark") === "true") {
  document.body.classList.add("dark-mode");
  document.getElementById("darkToggle").checked = true;
}

// Login logic
function startApp() {
  username = document.getElementById("loginName").value.trim();
  useremail = document.getElementById("loginEmail").value.trim();
  if (!username || !useremail) {
    alert("Please enter both name and email.");
    return;
  }

  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("quizContainer").style.display = "block";
  welcomeUserEl.innerText = `👋 Hello, ${username}`;
  generateQuestion();
}

// Quiz logic
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion() {
  clearInterval(timer);
  timeLeft = 15;
  timerEl.innerText = `Time Left: ${timeLeft}s`;
  questionStartTime = Date.now();

  timer = setInterval(() => {
    timeLeft--;
    timerEl.innerText = `Time Left: ${timeLeft}s`;
    if (timeLeft === 0) {
      clearInterval(timer);
      wrongSound.play();
      timePerQuestion.push("Timeout");
      skipQuestion();
    }
  }, 1000);

  let a, b, operator, questionKey;
  do {
    a = getRandomInt(1 * level, 10 * level);
    b = getRandomInt(1, 10 * level);
    const operators = ["+", "-", "*", "/"];
    operator = operators[getRandomInt(0, 3)];
    questionKey = `${a}${operator}${b}`;
  } while (askedQuestions.has(questionKey) || (operator === "/" && a % b !== 0));
  askedQuestions.add(questionKey);

  switch (operator) {
    case "+": currentAnswer = a + b; break;
    case "-": currentAnswer = a - b; break;
    case "*": currentAnswer = a * b; break;
    case "/": currentAnswer = a / b; break;
  }

  questionEl.innerText = `What is ${a} ${operator} ${b}?`;
  answerInput.value = "";
  answerInput.focus();
}

function skipQuestion() {
  questionCount++;
  const timeTaken = Date.now() - questionStartTime;
  timePerQuestion.push(`${Math.round(timeTaken / 1000)}s`);

  if (questionCount % totalQuestionsPerLevel === 0) {
    level++;
    levelUpSound.play();
    levelEl.innerText = `Level: ${level}`;
    askedQuestions.clear();
  }

  if (questionCount >= totalQuestionsPerLevel * 3) {
    endQuiz();
    return;
  }

  scoreEl.innerText = `Score: ${score}`;
  progressEl.innerText = `Question ${questionCount + 1} of ${totalQuestionsPerLevel}`;
  generateQuestion();
}

submitBtn.addEventListener("click", () => {
  const userAns = Number(answerInput.value);
  clearInterval(timer);
  if (userAns === currentAnswer) {
    correctSound.play();
    score++;
  } else {
    wrongSound.play();
  }
  skipQuestion();
});

function endQuiz() {
  clearInterval(timer);

  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboard.push({ name: username, score });
  leaderboard.sort((a, b) => b.score - a.score);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard.slice(0, 5)));

  const avgTime =
    timePerQuestion.filter(t => t !== "Timeout").length > 0
      ? (
          timePerQuestion.filter(t => t !== "Timeout").reduce((acc, t) => acc + parseInt(t), 0) /
          timePerQuestion.filter(t => t !== "Timeout").length
        ).toFixed(1) + "s"
      : "N/A";

  questionEl.innerHTML = `
    🎉 Quiz Completed!<br><br>
    👤 <strong>${username}</strong><br>
    🧠 Final Score: ${score}/${questionCount}<br>
    ⏱ Avg Time/Question: ${avgTime}<br><br>
    🏆 <strong>Leaderboard:</strong><br>
    ${leaderboard.slice(0, 5).map((e, i) => `${i + 1}. ${e.name} - ${e.score} pts`).join("<br>")}
  `;
  answerInput.style.display = "none";
  timerEl.style.display = "none";
  submitBtn.style.display = "none";

  generateCertificate();
}

// 🎓 Certificate Generator
function generateCertificate() {
  const ctx = certCanvas.getContext("2d");
  certCanvas.style.display = "block";
  certLink.style.display = "inline-block";

  // Optional background
  const img = new Image();
  img.src = "cert-bg.png"; // Optional background
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 600, 400);
    drawText();
    certLink.href = certCanvas.toDataURL("image/png");
  };

  function drawText() {
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText(`Certificate of Completion`, 180, 80);
    ctx.font = "16px Arial";
    ctx.fillText(`Awarded to: ${username}`, 150, 150);
    ctx.fillText(`Email: ${useremail}`, 150, 180);
    ctx.fillText(`Score: ${score} / ${questionCount}`, 150, 210);
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 150, 240);
  }
}
