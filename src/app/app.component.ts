import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

import {
  io,
  Socket
} from 'socket.io-client';


interface Question {
  id: number;
  q: string;
  a1: string;
  a2: string;
  a3: string;
}


interface Scores {
  1: number;
  2: number;
  3: number;
}


interface Answers {
  1: number | null;
  2: number | null;
  3: number | null;
}


@Component({
  selector: 'app-root',

  standalone: true,

  imports: [
    ButtonModule,
    FormsModule
  ],

  templateUrl: './app.component.html',

  styleUrl: './app.component.css'
})


export class AppComponent
  implements OnInit, OnDestroy {


  // ==================================================
  // SOCKET
  // ==================================================

  socket!: Socket;


  // ==================================================
  // ROOM
  // ==================================================

  roomId = '';

  joined = false;

  playerNumber = 0;

  playerCount = 0;

  message = '';


  // ==================================================
  // JÁTÉK
  // ==================================================

  question: Question | null = null;

  questionNumber = 0;

  totalQuestions = 3;

  timeLeft = 0;

  gameStarted = false;

  gameFinished = false;

  roundFinished = false;


  // ==================================================
  // VÁLASZ
  // ==================================================

  myAnswer: number | null = null;

  answers: Answers = {
    1: null,
    2: null,
    3: null
  };


  correctAnswer: number | null = null;


  // ==================================================
  // PONTSZÁM
  // ==================================================

  scores: Scores = {
    1: 0,
    2: 0,
    3: 0
  };


  // ==================================================
  // TIMER
  // ==================================================

  private countdownInterval?: ReturnType<typeof setInterval>;


  // ==================================================
  // CONSTRUCTOR
  // ==================================================

  constructor() {}


  // ==================================================
  // INIT
  // ==================================================

  ngOnInit(): void {

    this.connectToServer();

  }


  // ==================================================
  // DESTROY
  // ==================================================

  ngOnDestroy(): void {

    this.clearCountdown();

    if (this.socket) {
      this.socket.disconnect();
    }

  }


  // ==================================================
  // SOCKET CONNECTION
  // ==================================================

  connectToServer(): void {

    this.socket = io('http://192.168.1.50:3000');


    // -----------------------------------------------
    // SZoba létrehozva
    // -----------------------------------------------

    this.socket.on(
      'roomCreated',
      (data) => {

        this.roomId = data.roomId;

        this.playerNumber = data.playerNumber;

        this.joined = true;

        this.message =
          `Csoport létrehozva: ${this.roomId}`;

      }
    );


    // -----------------------------------------------
    // Szobához csatlakozás
    // -----------------------------------------------

    this.socket.on(
      'roomJoined',
      (data) => {

        this.roomId = data.roomId;

        this.playerNumber = data.playerNumber;

        this.joined = true;

        this.message =
          `Csatlakoztál! Te vagy a ${this.playerNumber}. játékos.`;

      }
    );


    // -----------------------------------------------
    // Játékosok száma
    // -----------------------------------------------

    this.socket.on(
      'playerCount',
      (data) => {

        this.playerCount = data.count;

        if (data.count < 3) {

          this.message =
            `Játékosok: ${data.count}/3`;

        }

      }
    );


    // -----------------------------------------------
    // Játék indul
    // -----------------------------------------------

    this.socket.on(
      'gameStarting',
      (data) => {

        this.message = data.message;

      }
    );


    // -----------------------------------------------
    // Új kérdés
    // -----------------------------------------------

    this.socket.on(
      'newQuestion',
      (data) => {

        this.startNewQuestion(data);

      }
    );


    // -----------------------------------------------
    // Saját válasz elfogadva
    // -----------------------------------------------

    this.socket.on(
      'answerAccepted',
      (data) => {

        this.myAnswer = data.answer;

        this.message =
          'Válaszod rögzítve. Várjuk a többieket...';

      }
    );


    // -----------------------------------------------
    // KÖR EREDMÉNYE
    // -----------------------------------------------

    this.socket.on(
      'roundResult',
      (data) => {

        this.roundFinished = true;

        this.answers = data.answers;

        this.correctAnswer =
          data.correctAnswer;

        this.scores =
          data.scores;

        this.clearCountdown();

        this.timeLeft = 0;

      }
    );


    // -----------------------------------------------
    // Játék vége
    // -----------------------------------------------

    this.socket.on(
      'gameFinished',
      (data) => {

        this.gameFinished = true;

        this.gameStarted = false;

        this.scores = data.scores;

        this.message = '🏆 A játék véget ért!';

      }
    );


    // -----------------------------------------------
    // Hiba
    // -----------------------------------------------

    this.socket.on(
      'errorMessage',
      (data) => {

        this.message = data.message;

      }
    );

  }


  // ==================================================
  // ROOM LÉTREHOZÁSA
  // ==================================================

  createRoom(): void {

    this.socket.emit('createRoom');

  }


  // ==================================================
  // CSATLAKOZÁS
  // ==================================================

  joinRoom(): void {

    const id =
      this.roomId.trim().toUpperCase();


    if (!id) {

      this.message =
        'Írd be a csoport azonosítóját!';

      return;

    }


    this.socket.emit(
      'joinRoom',
      {
        roomId: id
      }
    );

  }


  // ==================================================
  // ÚJ KÉRDÉS
  // ==================================================

  private startNewQuestion(data: any): void {

    this.question = data.question;

    this.questionNumber =
      data.questionNumber;

    this.totalQuestions =
      data.totalQuestions;

    this.timeLeft =
      data.timeLimit;

    this.gameStarted = true;

    this.gameFinished = false;

    this.roundFinished = false;

    this.myAnswer = null;

    this.correctAnswer = null;


    this.answers = {
      1: null,
      2: null,
      3: null
    };


    this.scores =
      data.scores;


    this.message =
      `Kérdés ${this.questionNumber}/${this.totalQuestions}`;


    this.startCountdown();

  }


  // ==================================================
  // VÁLASZ
  // ==================================================

  sendAnswer(answer: number): void {

    // Ha már válaszolt
    if (this.myAnswer !== null) {
      return;
    }


    // Ha lejárt az idő
    if (this.timeLeft <= 0) {
      return;
    }


    this.socket.emit(
      'submitAnswer',
      {
        answer: answer
      }
    );


    // Azonnal elszínezzük
    // a saját gombunkat.
    this.myAnswer = answer;

  }


  // ==================================================
  // COUNTDOWN
  // ==================================================

  private startCountdown(): void {

    this.clearCountdown();


    this.countdownInterval =
      setInterval(() => {

        if (this.timeLeft > 0) {

          this.timeLeft--;

        }


        if (this.timeLeft <= 0) {

          this.clearCountdown();

          if (this.myAnswer === null) {

            this.message =
              '⏰ Lejárt az idő!';

          }

        }

      }, 1000);

  }


  // ==================================================
  // COUNTDOWN STOP
  // ==================================================

  private clearCountdown(): void {

    if (this.countdownInterval) {

      clearInterval(
        this.countdownInterval
      );

      this.countdownInterval =
        undefined;

    }

  }


  // ==================================================
  // GOMB SZÍN
  // ==================================================

  getButtonClass(
    answer: number
  ): string {

    // -----------------------------------------------
    // Saját válasz
    // -----------------------------------------------

    if (
      !this.roundFinished &&
      this.myAnswer === answer
    ) {

      return `player-${this.playerNumber}`;

    }


    // -----------------------------------------------
    // Eredmény
    // -----------------------------------------------

    if (this.roundFinished) {

      let classes = '';


      if (
        this.correctAnswer === answer
      ) {

        classes += ' correct-answer';

      }


      if (
        this.getAnswerBackground(answer)
      ) {

        classes += ' has-answers';

      }


      return classes;

    }


    return '';

  }


  // ==================================================
  // HÁTTÉR A VÁLASZOK ALAPJÁN
  // ==================================================

  getAnswerBackground(
    answer: number
  ): string {

    if (!this.roundFinished) {
      return '';
    }


    const players: number[] = [];


    if (this.answers[1] === answer) {
      players.push(1);
    }

    if (this.answers[2] === answer) {
      players.push(2);
    }

    if (this.answers[3] === answer) {
      players.push(3);
    }


    if (players.length === 0) {
      return '';
    }


    const colors: Record<number, string> = {

      1: '#c71c1c', // piros
      2: '#ddd5d5',  // fehér
      3: '#22c55e' // zöld

    };


    const percentage =
      100 / players.length;


    const parts: string[] = [];


    players.forEach(
      (player, index) => {

        const start =
          index * percentage;

        const end =
          (index + 1) * percentage;


        parts.push(
          `${colors[player]} ${start}% ${end}%`
        );

      }
    );


    return `linear-gradient(
      to right,
      ${parts.join(', ')}
    )`;

  }


  // ==================================================
  // HELYES VÁLASZ?
  // ==================================================

  isCorrectAnswer(
    answer: number
  ): boolean {

    return (
      this.roundFinished &&
      this.correctAnswer === answer
    );

  }


  // ==================================================
  // JÁTÉKOS NEVE
  // ==================================================

  getPlayerName(
    playerNumber: number
  ): string {

    return `${playerNumber}. játékos`;

  }

}