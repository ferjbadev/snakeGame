import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_SPEED = 150;

type Position = { x: number; y: number };
type Direction = { x: number; y: number };

const SnakeGame = () => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const directionRef = useRef(direction);
  const gameLoopRef = useRef<number | null>(null);

  // Generate random food position
  const generateFood = useCallback((): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  // Check collision with walls or self
  const checkCollision = useCallback((head: Position): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    return snake.some(segment => segment.x === head.x && segment.y === head.y);
  }, [snake]);

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y,
      };

      if (checkCollision(newHead)) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if snake ate food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood());
        setSpeed(prev => Math.max(50, prev - 5)); // Increase speed
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, food, checkCollision, generateFood]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver, moveSnake, speed]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      const keyMap: { [key: string]: Direction } = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const newDirection = keyMap[e.key];
      if (newDirection) {
        e.preventDefault();
        // Prevent reversing direction
        if (
          newDirection.x !== -directionRef.current.x ||
          newDirection.y !== -directionRef.current.y
        ) {
          directionRef.current = newDirection;
          setDirection(newDirection);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  // Reset game
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood({ x: 15, y: 15 });
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setIsPlaying(false);
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (gameOver) {
      resetGame();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-green-600 dark:text-green-400">
            🐍 Juego de la Serpiente
          </CardTitle>
          <CardDescription className="text-lg">
            Usa las flechas o WASD para mover la serpiente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score and Controls */}
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              Puntuación: {score}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={togglePlay}
                variant={isPlaying ? "secondary" : "default"}
                size="lg"
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    {gameOver ? 'Reintentar' : 'Jugar'}
                  </>
                )}
              </Button>
              <Button onClick={resetGame} variant="outline" size="lg">
                <RotateCcw className="mr-2 h-5 w-5" />
                Reiniciar
              </Button>
            </div>
          </div>

          {/* Game Board */}
          <div className="flex justify-center">
            <div
              className="border-4 border-green-600 dark:border-green-400 rounded-lg bg-green-50 dark:bg-gray-800 shadow-xl"
              style={{
                width: GRID_SIZE * CELL_SIZE,
                height: GRID_SIZE * CELL_SIZE,
                position: 'relative',
              }}
            >
              {/* Snake */}
              {snake.map((segment, index) => (
                <div
                  key={index}
                  className={`absolute ${
                    index === 0
                      ? 'bg-green-700 dark:bg-green-500 rounded-md'
                      : 'bg-green-600 dark:bg-green-400 rounded-sm'
                  }`}
                  style={{
                    left: segment.x * CELL_SIZE,
                    top: segment.y * CELL_SIZE,
                    width: CELL_SIZE - 2,
                    height: CELL_SIZE - 2,
                    transition: 'all 0.05s',
                  }}
                />
              ))}

              {/* Food */}
              <div
                className="absolute bg-red-500 rounded-full animate-pulse"
                style={{
                  left: food.x * CELL_SIZE,
                  top: food.y * CELL_SIZE,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                }}
              />

              {/* Game Over Overlay */}
              {gameOver && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                  <div className="text-center text-white">
                    <h2 className="text-4xl font-bold mb-2">¡Juego Terminado!</h2>
                    <p className="text-2xl mb-4">Puntuación Final: {score}</p>
                    <Button onClick={resetGame} size="lg" variant="secondary">
                      Jugar de Nuevo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>🎮 Controles: Flechas del teclado o W/A/S/D</p>
            <p>🍎 Come la comida roja para crecer y ganar puntos</p>
            <p>⚡ La velocidad aumenta con cada comida</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SnakeGame;
