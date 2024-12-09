import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Gamepad2, Pause, Play, RefreshCw } from 'lucide-react';

const SnakeGame = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const gameRef = useRef({
    snake: [],
    food: null,
    obstacles: [],
    dx: 1,
    dy: 0,
    speed: 150
  });

  const gridSize = 20;
  const tileCount = 20;

  useEffect(() => {
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
    initGame();
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let gameInterval;

    if (!isGameOver && !isPaused) {
      gameInterval = setInterval(() => {
        updateGame(ctx);
      }, gameRef.current.speed);
    }

    return () => clearInterval(gameInterval);
  }, [isGameOver, isPaused]);

  const initGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    gameRef.current = {
      snake: [{ x: 10, y: 10 }],
      food: getRandomFood(),
      obstacles: generateObstacles(),
      dx: 1,
      dy: 0,
      speed: 150
    };
    setScore(0);
    setIsGameOver(false);
  };

  const getRandomFood = () => {
    const food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
    const { snake, obstacles } = gameRef.current;

    // Проверка, что еда не появится на змее или препятствиях
    const isOverlapping = 
      snake.some(segment => segment.x === food.x && segment.y === food.y) ||
      obstacles.some(obs => obs.x === food.x && obs.y === food.y);

    return isOverlapping ? getRandomFood() : food;
  };

  const generateObstacles = () => {
    const obstacles = [];
    const obstacleCount = Math.floor(Math.random() * 5) + 3; // 3-7 препятствий

    for (let i = 0; i < obstacleCount; i++) {
      const obstacle = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
        length: Math.floor(Math.random() * 3) + 2 // Длина 2-4 сегмента
      };
      obstacles.push(obstacle);
    }

    return obstacles;
  };

  const updateGame = (ctx) => {
    const { snake, food, obstacles, dx, dy } = gameRef.current;
    const newHead = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Проверка столкновений
    if (
      newHead.x < 0 || newHead.x >= tileCount ||
      newHead.y < 0 || newHead.y >= tileCount ||
      snake.some(segment => segment.x === newHead.x && segment.y === newHead.y) ||
      obstacles.some(obs => {
        if (obs.length === 1) {
          return newHead.x === obs.x && newHead.y === obs.y;
        }
        // Для препятствий длиной более 1 сегмента
        for (let i = 0; i < obs.length; i++) {
          if (newHead.x === obs.x && newHead.y === obs.y) {
            return true;
          }
          // Обновляем направление препятствия (горизонтальное или вертикальное)
          obs.x += obs.dx || 0;
          obs.y += obs.dy || 0;
        }
        return false;
      })
    ) {
      gameOver();
      return;
    }

    snake.unshift(newHead);

    // Проверка съедания еды
    if (newHead.x === food.x && newHead.y === food.y) {
      const newScore = score + 1;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('snakeHighScore', newScore.toString());
      }
      gameRef.current.food = getRandomFood();

      // Увеличение сложности: уменьшение скорости и добавление препятствий
      if (newScore % 5 === 0) {
        gameRef.current.speed = Math.max(50, gameRef.current.speed - 10);
        gameRef.current.obstacles.push(...generateObstacles());
      }
    } else {
      snake.pop();
    }

    // Отрисовка
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Рисование змеи
    ctx.fillStyle = '#2ecc71';
    snake.forEach(segment => {
      ctx.fillRect(
        segment.x * gridSize, 
        segment.y * gridSize, 
        gridSize - 2, 
        gridSize - 2
      );
    });

    // Рисование еды
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(
      food.x * gridSize, 
      food.y * gridSize, 
      gridSize - 2, 
      gridSize - 2
    );

    // Рисование препятствий
    ctx.fillStyle = '#8e44ad';
    obstacles.forEach(obs => {
      // Для препятствий длиной более 1 сегмента
      for (let i = 0; i < obs.length; i++) {
        ctx.fillRect(
          obs.x * gridSize, 
          obs.y * gridSize, 
          gridSize - 2, 
          gridSize - 2
        );
        // Обновляем позицию препятствия
        obs.x += obs.dx || 0;
        obs.y += obs.dy || 0;

        // Возврат препятствия в пределы игрового поля
        if (obs.x < 0) obs.x = tileCount - 1;
        if (obs.x >= tileCount) obs.x = 0;
        if (obs.y < 0) obs.y = tileCount - 1;
        if (obs.y >= tileCount) obs.y = 0;
      }
    });
  };

  const gameOver = () => {
    setIsGameOver(true);
  };

  const handleKeyDown = (event) => {
    const { dx, dy } = gameRef.current;
    switch (event.key) {
      case 'ArrowLeft':
        if (dx !== 1) gameRef.current = { ...gameRef.current, dx: -1, dy: 0 };
        break;
      case 'ArrowRight':
        if (dx !== -1) gameRef.current = { ...gameRef.current, dx: 1, dy: 0 };
        break;
      case 'ArrowUp':
        if (dy !== 1) gameRef.current = { ...gameRef.current, dx: 0, dy: -1 };
        break;
      case 'ArrowDown':
        if (dy !== -1) gameRef.current = { ...gameRef.current, dx: 0, dy: 1 };
        break;
    }
  };

  const handleMobileControl = (direction) => {
    const { dx, dy } = gameRef.current;
    switch (direction) {
      case 'left':
        if (dx !== 1) gameRef.current = { ...gameRef.current, dx: -1, dy: 0 };
        break;
      case 'right':
        if (dx !== -1) gameRef.current = { ...gameRef.current, dx: 1, dy: 0 };
        break;
      case 'up':
        if (dy !== 1) gameRef.current = { ...gameRef.current, dx: 0, dy: -1 };
        break;
      case 'down':
        if (dy !== -1) gameRef.current = { ...gameRef.current, dx: 0, dy: 1 };
        break;
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Змейка с препятствиями</h1>
        <div className="flex justify-between">
          <p>Счет: {score}</p>
          <p>Рекорд: {highScore}</p>
        </div>
      </div>

      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400} 
        className="border-4 border-green-600 rounded-lg"
      />

      <div className="mt-4 flex space-x-2">
        <Button onClick={togglePause} variant="secondary">
          {isPaused ? <Play className="mr-2" /> : <Pause className="mr-2" />}
          {isPaused ? 'Продолжить' : 'Пауза'}
        </Button>

        <AlertDialog open={isGameOver}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Игра окончена!</AlertDialogTitle>
              <AlertDialogDescription>
                Ваш счет: {score}
                <br />
                Лучший счет: {highScore}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={initGame}>
                <RefreshCw className="mr-2" /> Играть снова
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 max-w-xs">
        <Button 
          variant="outline" 
          onClick={() => handleMobileControl('up')}
          className="col-start-2"
        >
          ↑
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleMobileControl('left')}
          className="col-start-1 col-span-1 row-start-2"
        >
          ←
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleMobileControl('right')}
          className="col-start-3 col-span-1 row-start-2"
        >
          →
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleMobileControl('down')}
          className="col-start-2 row-start-3"
        >
          ↓
        </Button>
      </div>
    </div>
  );
};

export default SnakeGame;
