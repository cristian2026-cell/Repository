document.addEventListener('DOMContentLoaded', () => {
  
  const themeToggle = document.getElementById('theme-toggle');
  const timerDisplay = document.getElementById('timer');
  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');

  let timeLeft = 25 * 60; 
  let timerId = null;
  let todos = JSON.parse(localStorage.getItem('focoplan-todos')) || [];

  // Corrección: Inicialización correcta del array de la gráfica
  let chartData = JSON.parse(localStorage.getItem('focoplan-chart-data')) ||;

  // --- CONFIGURACIÓN DE CHART.JS ---
  const ctx = document.getElementById('productivityChart').getContext('2d');
  
  const getPrimaryColor = () => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();

  const productivityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [{
        label: 'Sesiones Completadas',
        data: chartData,
        backgroundColor: getPrimaryColor(),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
        y: { 
          grid: { color: () => getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color').trim() },
          ticks: { stepSize: 1, color: '#94a3b8' },
          beginAtZero: true
        }
      }
    }
  });

  // --- TEMA OSCURO ---
  if (localStorage.getItem('focoplan-theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️ Modo Claro';
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.textContent = isDark ? '🌙 Modo Oscuro' : '☀️ Modo Claro';
    localStorage.setItem('focoplan-theme', isDark ? 'light' : 'dark');
    
    // Sincronizar colores de la gráfica
    setTimeout(() => {
      productivityChart.data.datasets[0].backgroundColor = getPrimaryColor();
      productivityChart.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color').trim();
      productivityChart.update();
    }, 50);
  });

  // --- TEMPORIZADOR ---
  function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  startBtn.addEventListener('click', () => {
    if (timerId === null) {
      startBtn.textContent = 'Pausar';
      startBtn.style.background = 'var(--danger)';
      
      timerId = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft--;
          updateDisplay();
        } else {
          clearInterval(timerId);
          timerId = null;
          
          // Registrar en el día correcto (Lunes = 0, Domingo = 6)
          const currentDay = (new Date().getDay() + 6) % 7; 
          chartData[currentDay] += 1;
          localStorage.setItem('focoplan-chart-data', JSON.stringify(chartData));
          
          productivityChart.data.datasets[0].data = chartData;
          productivityChart.update();

          alert('🎯 ¡Sesión completada! Rendimiento actualizado en los gráficos.');
          resetTimer();
        }
      }, 1000);
    } else {
      clearInterval(timerId);
      timerId = null;
      startBtn.textContent = 'Continuar';
      startBtn.style.background = 'var(--primary)';
    }
  });

  function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    timeLeft = 25 * 60;
    updateDisplay();
    startBtn.textContent = 'Iniciar';
    startBtn.style.background = 'var(--primary)';
  }

  resetBtn.addEventListener('click', resetTimer);

  // --- GESTIÓN DE TAREAS ---
  function saveAndRenderTodos() {
    localStorage.setItem('focoplan-todos', JSON.stringify(todos));
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
      const li = document.createElement('li');
      li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
      li.innerHTML = `
        <span class="todo-text">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
          ${todo.text}
        </span>
        <button class="btn-delete" data-index="${index}">Eliminar</button>
      `;
      todoList.appendChild(li);
    });
  }

  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    todos.push({ text, completed: false });
    todoInput.value = '';
    saveAndRenderTodos();
  });

  todoList.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      const index = e.target.getAttribute('data-index');
      todos[index].completed = e.target.checked;
      saveAndRenderTodos();
    }
  });

  todoList.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-delete')) {
      const index = e.target.getAttribute('data-index');
      todos.splice(index, 1);
      saveAndRenderTodos();
    }
  });

  updateDisplay();
  saveAndRenderTodos();
});
